const Order = require("../Models/Order");
const User = require("../Models/User");
const Item = require("../Models/Item");
const mongoose = require("mongoose");
const { io, socket_users } = require("../socket/socket");
const { default: axios } = require("axios");
const { getFcmToken } = require("../Firebase/fmc_token_service");
const { messaging } = require("../Firebase/firebase_config");

// Function to create a new order
const createOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress, restaurantId, eta } = req.body;
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const itemDetails = await Item.findById(item.item);
      if (!itemDetails) {
        return res
          .status(400)
          .json({ message: `Item with ID ${item.item} not found` });
      }
      totalAmount += itemDetails.price * item.quantity;
    }

    const newOrder = new Order({
      userId,
      items,
      totalAmount: totalAmount.toFixed(2),
      shippingAddress,
      eta,
      restaurantId,
      deliveryPersonId: userId, // just for the time being , future change
    });

    const savedOrder = await newOrder.save();
    const new_order_history = await getNewOrderHistory(userId);
    const customerSocketId=socket_users[userId].socketId
    console.log("customer socket id ",customerSocketId);
    io.to(customerSocketId).emit("order_history_updated", new_order_history);

    const token = await getFcmToken(userId);
    const message = {
      token, // User's FCM token
      notification: {
        title: "Let's Eat Delivery",
        body: "Your order was placed! Cooking starts after you pay. Thanks for choosing Let's Eat Delivery!",
        image:
          "https://static.vecteezy.com/system/resources/previews/019/796/973/non_2x/motorbike-delivery-man-logo-icon-symbol-template-free-vector.jpg",

      },
      data: {
        customData: "custom data value",
      },
    };

    messaging.send(message);
    res.status(201).json({
      message: "Order created successfully !",
      orderId: savedOrder._id,
      orderStatus: savedOrder.status,
      totalAmount: savedOrder.totalAmount,
      eta: savedOrder.eta,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const getNewOrderHistory = async (id) => {
  try {
    const orders = await Order.find({ userId: id })
      .populate("userId", "nationalId phoneNumber username")
      .populate("items.item", "name price preparationTime")
      .populate("restaurantId", "name address")
      .populate("deliveryPersonId", "username phoneNumber");

    if (!orders || orders.length === 0) {
      return {
        pending: [],
        processing: [],
        readyForPickup: [],
        pickedUp: [],
        onTransit: [],
        delivered: [],
        cancelled: [],
      };
    }

    // Group orders by status
    const groupedOrders = {
      pending: [],
      processing: [],
      readyForPickup: [],
      pickedUp: [],
      onTransit: [],
      delivered: [],
      cancelled: [],
    };

    // Categorizing orders based on their status
    for (const order of orders) {
      switch (order.status) {
        case "Pending":
          groupedOrders.pending.push(order);
          break;
        case "Processing":
          groupedOrders.processing.push(order);
          break;
        case "Ready For Pickup":
          groupedOrders.readyForPickup.push(order);
          break;
        case "Picked Up":
          groupedOrders.pickedUp.push(order);
          break;
        case "OnTransit":
          groupedOrders.onTransit.push(order);
          break;
        case "Delivered":
          groupedOrders.delivered.push(order);
          break;
        case "Cancelled":
          groupedOrders.cancelled.push(order);
          break;
        default:
          console.warn(`Unknown status: ${order.status}`);
          break;
      }
    }

    return groupedOrders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders.");
  }
};

// Function to get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "all") {
      const orders = await Order.find().populate("items.item");
      return res.status(200).json(orders);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id).populate("items.item");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to get Restaurant order by ID
const getRestaurantOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.find({ restaurantId: id })
      .populate("userId", "name nationalId phoneNumber username")
      .populate("items.item", "name price")
      .populate("deliveryPersonId", "username phoneNumber image")
      .populate("payment", "status paymentDate amount paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to get User order by ID
const getUserOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orders = await Order.find({ userId: id })
      .populate("userId", "nationalId phoneNumber username")
      .populate("items.item", "name price preparationTime")
      .populate("restaurantId", "name address location subAccountId")
      .populate(
        "deliveryPersonId",
        "username phoneNumber image rating vehicle"
      );

    if (!orders) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Group orders by status
    const groupedOrders = {
      pending: [],
      processing: [],
      readyForPickup: [],
      pickedUp: [],
      onTransit: [],
      delivered: [],
      cancelled: [],
    };

    // Categorizing orders based on their status
    orders.forEach((order) => {
      switch (order.status) {
        case "Pending":
          groupedOrders.pending.push(order);
          break;
        case "Processing":
          groupedOrders.processing.push(order);
          break;
        case "Ready For Pickup":
          groupedOrders.readyForPickup.push(order);
          break;
        case "Picked Up":
          groupedOrders.pickedUp.push(order);
          break;
        case "OnTransit":
          groupedOrders.onTransit.push(order);
          break;
        case "Delivered":
          groupedOrders.delivered.push(order);
          break;
        case "Cancelled":
          groupedOrders.cancelled.push(order);
          break;
        default:
          console.warn(`Unknown status: ${order.status}`);
          break;
      }
    });

    res.status(200).json(groupedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getOrderTrackingRoutes = async (req, res) => {
  const { userLatitude, userLongitude, restaurantLocation } = req.params;
  try {
    // const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurantLocation.coordinates[1]},${restaurantLocation.coordinates[0]}&transportMode=pedestrian&return=summary`;

    // const response = await axios.get(requestUrl);

    console.log("Request received for optimized route !");

    res.json({
      routeCoordinates : [
        { latitude: 9.0200, longitude: 38.7900 }, // Megenagna
        { latitude: 9.0185, longitude: 38.7850 },
        { latitude: 9.0160, longitude: 38.7800 },
        { latitude: 9.0140, longitude: 38.7750 },
        { latitude: 9.0120, longitude: 38.7700 },
        { latitude: 9.0100, longitude: 38.7650 },
        { latitude: 9.0080, longitude: 38.7600 },
        { latitude: 9.0060, longitude: 38.7550 },
        { latitude: 9.0040, longitude: 38.7500 },
        { latitude: 9.0020, longitude: 38.7450 },
        { latitude: 9.0000, longitude: 38.7400 }, // Meskel Square
      ],
      userLocation: { latitude: 9.0200, longitude: 38.7900 },
      destination: { latitude: 9.0000, longitude: 38.7400 },
    });
    
    
  } catch (error) {
    console.log(error);
  }
};

// Function to get current order of a delivery person
const getDeliveryPersonOrder = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId, "assignedOrder");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = await Order.findById(
      user.assignedOrder,
      "eta userId status shippingAddress"
    ).populate("userId", "nationalId phoneNumber username");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to get delivery history  of a delivery person
const getDeliveryHistory = async (req, res) => {
  try {
    const { deliveryPersonId } = req.params;

    const orders = await Order.find(
      { deliveryPersonId: deliveryPersonId },
      "eta userId status shippingAddress"
    ).populate("userId", "nationalId phoneNumber username");

    if (!orders) {
      return res.status(200).json({ message: "No delivery history" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to get Orders by status
const getByStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.params;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      restaurantId: id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("userId", "name nationalId phoneNumber username")
      .populate("items.item", "name price")
      .populate("deliveryPersonId", "username phoneNumber image")
      .populate("payment", "status paymentDate amount paymentMethod");

    // Filter orders by status or payment status
    const filteredOrders = orders.filter(
      (order) =>
        order.status === status ||
        (order.payment && order.payment.status === status)
    );

    if (!filteredOrders) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(filteredOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name")
      .populate("items.item", "name price");
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to update order status
const updateDeliveryPerson = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId, restaurantId } = req.body;

    const order = await Order.findById(
      orderId,
      "eta userId status shippingAddress deliveryPersonId"
    ).populate("userId", "nationalId phoneNumber username");

    const user = await User.findById(deliveryPersonId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "User (delivery person) not found" });
    }

    order.deliveryPersonId = deliveryPersonId;
    await order.save();
    user.assignedOrder = order._id;
    user.isActive = false;
    await user.save();

    const deliveryPersonSocketId = socket_users[deliveryPersonId]?.socketId;
    const restaurantSocketId = socket_users[restaurantId]?.socketId;

    if (!deliveryPersonSocketId) {
      res.json({ error: "user is not connected to socket.io server" });
      return;
    }

    if (!restaurantSocketId) {
      res.json({ error: "user is not connected to socket.io server" });
      return;
    }

    io.to(deliveryPersonSocketId).emit("currentOrder", {
      order,
    });

    io.to(restaurantSocketId).emit("offerAccepted", {
      orderId,
      deliveryPersonId: {
        username: user.username,
        phoneNumber: user.phoneNumber,
        image: user.image,
        _id: user._id,
      },
    });

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to update order status
const offerNotAccepted = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { restaurantId } = req.body;

    const order = await Order.findById(orderId);
    order.deliveryPersonId = null;
    order.save();

    const restaurantSocketId = socket_users[restaurantId]?.socketId;

    if (!restaurantSocketId) {
      res.json({ error: "user is not connected to socket.io server" });
      return;
    }

    io.to(restaurantSocketId).emit("offerNotAccepted", {
      orderId,
      deliveryPersonId: null,
    });

    res.status(200).json({
      message:
        "Delivery perosn did not accepted your offer, Please assign another one ! ",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to update order status
const sendOfferToDeliverPerson = async (req, res) => {
  try {
    const { orderId, deliveryPersonId, restaurantId } = req.params;
    const order = await Order.findById(
      orderId,
      "shippingAddress restaurantId eta"
    ).populate("restaurantId", "address");

    const deliveryPersonSocketId = socket_users[deliveryPersonId]?.socketId;
    const restaurantSocketId = socket_users[restaurantId]?.socketId;

    if (!deliveryPersonSocketId) {
      io.to(restaurantSocketId).emit("offerNotAccepted", {
        orderId,
        deliveryPersonId: null,
      });

      res.json({ error: "user is not connected to socket.io server" });
      return;
    }

    io.to(deliveryPersonSocketId).emit("offer", {
      orderId: order._id,
      restaurantId: order.restaurantId._id,
      pickupLocation: order.restaurantId.address,
      deliveryLocation: order.shippingAddress.address,
      eta: order.eta,
    });

    res.json({ message: "Notification is sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to verify order
const verifyOrder = async (req, res) => {
  try {
    const { deliveryPersonId, scannedValue } = req.params;

    const user = await User.findById(deliveryPersonId, "assignedOrder");

    if (!user || !user.assignedOrder) {
      return res
        .status(400)
        .json({ message: "User does not have an assigned order" });
    }

    if (user.assignedOrder.toString() === scannedValue.trim()) {
      const order = await Order.findById(user.assignedOrder);
      console.log("Order ", order);
      order.status = "Delivered";
      user.assignedOrder = null;
      await user.save();
      await order.save();
      res.status(200).json({ verified: true });
    } else res.status(200).json({ message: "Order Id is not correct" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to delete an order
const getOptimizedRoute = async (req, res) => {
  try {
    console.log("Optimized Route Request Accepted !");
    res.json({
      routeCoordinates:[
        { latitude: 9.0200, longitude: 38.7900 }, // Megenagna
        { latitude: 9.0185, longitude: 38.7850 },
        { latitude: 9.0160, longitude: 38.7800 },
        { latitude: 9.0140, longitude: 38.7750 },
        { latitude: 9.0120, longitude: 38.7700 },
        { latitude: 9.0100, longitude: 38.7650 },
        { latitude: 9.0080, longitude: 38.7600 },
        { latitude: 9.0060, longitude: 38.7550 },
        { latitude: 9.0040, longitude: 38.7500 },
        { latitude: 9.0020, longitude: 38.7450 },
        { latitude: 9.0000, longitude: 38.7400 }, // Meskel Square
      ],
      userLocation: { latitude: 9.0200, longitude: 38.7900 },
      destination: { latitude: 9.0000, longitude: 38.7400 },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to delete an order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(id);
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getRestaurantOrderById,
  getUserOrderById,
  updateDeliveryPerson,
  getByStatus,
  getOrderTrackingRoutes,
  getDeliveryPersonOrder,
  verifyOrder,
  getDeliveryHistory,
  sendOfferToDeliverPerson,
  offerNotAccepted,
  getOptimizedRoute,
};
