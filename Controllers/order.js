const Order = require('../Models/Order');
const Item = require('../Models/Item');
const mongoose = require('mongoose');
const { io } = require('../socket/socket');
const { default: axios } = require('axios');


// Function to create a new order
const createOrder = async (req, res) => {
    try {
        const { userId, items, shippingAddress, restaurantId, eta } = req.body;
        // Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            const itemDetails = await Item.findById(item.item);
            if (!itemDetails) {
                return res.status(400).json({ message: `Item with ID ${item.item} not found` });
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
        const new_order_history = await getNewOrderHistory(userId)
        console.log(new_order_history)
        io.to('customers').emit('order_history_updated', new_order_history)

        res.status(201).json({ message: 'Order created successfully !', orderId: savedOrder._id, orderStatus: savedOrder.status, totalAmount: savedOrder.totalAmount, eta: savedOrder.eta });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getNewOrderHistory = async (id) => {
    try {
        const orders = await Order.find({ userId: id })
            .populate('userId', 'nationalId phoneNumber username')
            .populate('items.item', 'name price preparationTime')
            .populate('restaurantId', 'name address')
            .populate('deliveryPersonId', 'username phoneNumber');

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
                case 'Pending':
                    groupedOrders.pending.push(order);
                    break;
                case 'Processing':
                    groupedOrders.processing.push(order);
                    break;
                case 'Ready For Pickup':
                    groupedOrders.readyForPickup.push(order);
                    break;
                case 'Picked Up':
                    groupedOrders.pickedUp.push(order);
                    break;
                case 'OnTransit':
                    groupedOrders.onTransit.push(order);
                    break;
                case 'Delivered':
                    groupedOrders.delivered.push(order);
                    break;
                case 'Cancelled':
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

        if (id === 'all') {
            const orders = await Order.find().populate('items.item');
            return res.status(200).json(orders);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id).populate('items.item');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Function to get Restaurant order by ID
const getRestaurantOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.find({ restaurantId: id }).populate('userId', 'name nationalId phoneNumber username').populate('items.item', 'name price').populate('deliveryPersonId', 'username phoneNumber image').populate('payment', 'status paymentDate amount paymentMethod');

        console.log(order)

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Function to get User order by ID
const getUserOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const orders = await Order.find({ userId: id }).populate('userId', 'nationalId phoneNumber username').populate('items.item', 'name price preparationTime').populate('restaurantId', 'name address location').populate('deliveryPersonId', 'username phoneNumber image rating vehicle');

        if (!orders) {
            return res.status(404).json({ message: 'Order not found' });
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
        orders.forEach(order => {
            switch (order.status) {
                case 'Pending':
                    groupedOrders.pending.push(order);
                    break;
                case 'Processing':
                    groupedOrders.processing.push(order);
                    break;
                case 'Ready For Pickup':
                    groupedOrders.readyForPickup.push(order);
                    break;
                case 'Picked Up':
                    groupedOrders.pickedUp.push(order);
                    break;
                case 'OnTransit':
                    groupedOrders.onTransit.push(order);
                    break;
                case 'Delivered':
                    groupedOrders.delivered.push(order);
                    break;
                case 'Cancelled':
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
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderTrackingRoutes = async (req, res) => {
    const { userLatitude, userLongitude, restaurantLocation } = req.params
    try {

        const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurantLocation.coordinates[1]},${restaurantLocation.coordinates[0]}&transportMode=pedestrian&return=summary`;

        const response = await axios.get(requestUrl);

        res.json({ mapRoute: response.data })

    } catch (error) {
        console.log(error)
    }
}


// Function to get Orders by status
const getByStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.params
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            restaurantId: id,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('userId', 'name nationalId phoneNumber username')
            .populate('items.item', 'name price')
            .populate('deliveryPersonId', 'username phoneNumber image')
            .populate('payment', 'status paymentDate amount paymentMethod');


        // Filter orders by status or payment status
        const filteredOrders = orders.filter(order =>
            order.status === status || (order.payment && order.payment.status === status)
        );

        if (!filteredOrders) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(filteredOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Function to get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'name').populate('items.item', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};

// Function to update order status
const updateDeliveryPerson = async (req, res) => {

    try {
        const { id } = req.params;
        const { deliveryPersonId } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.deliveryPersonId = deliveryPersonId;
        await order.save();
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to delete an order
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await Order.findByIdAndDelete(id)
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createOrder, getOrderById, getAllOrders, updateOrderStatus, deleteOrder, getRestaurantOrderById, getUserOrderById, updateDeliveryPerson, getByStatus, getOrderTrackingRoutes };