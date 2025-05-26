const Payment = require("../Models/Payment");
const Promotion = require("../Models/Promotion");
const Refund = require("../Models/Refund");
const { chapa } = require("../Chapa/chapa");
const Order = require("../Models/Order");
const { activatePromotion } = require("./promotion");
const { socket_users, io } = require("../socket/socket");
const crypto = require("crypto");
const { getFcmToken } = require("../Firebase/fmc_token_service");
const { messaging } = require("../Firebase/firebase_config");
const { default: axios } = require("axios");
const Subscription = require("../Models/Subscription");
const Restaurant = require("../Models/Restaurant");

// Create a new payment
const createPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, paymentMethod, restaurantId } = req.body;

    if (!orderId || !userId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payment = new Payment({
      orderId,
      userId,
      restaurantId,
      paymentMethod,
      amount,
    });

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate(
      "orderId userId restaurantId"
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments for a user
const getAllPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ userId }).populate("orderId");

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = status;
    const updatedPayment = await payment.save();

    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllPaymentsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.json({ message: "Restaurant ID is required" });
    }

    const payments = await Payment.find({ restaurantId })
      .populate({
        path: "orderId",
        populate: {
          path: "items.item",
          select: "name price",
        },
      })
      .populate("userId", "-password")
      .populate("orderId.shippingAddress", "address city")
      .sort({ createdAt: -1 });

    if (!payments.length) {
      return res.json({ message: "No payments found for this restaurant" });
    }

    res.status(200).json(payments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getPaymentsByDateRange = async (req, res) => {
  const { startDate, endDate, restaurantId } = req.params;
  console.log("report ", startDate, endDate, restaurantId);
  try {
    const payments = await Payment.find({
      restaurantId,
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate({
        path: "orderId",
        populate: {
          path: "items.item",
          select: "name price",
        },
      })
      .populate("userId", "-password")
      .populate("orderId.shippingAddress", "address city")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching payments", error });
  }
};

const getPromotionPaymentPage = async (req, res) => {
  const { phoneNumber, amount, firstName, promotionId } = req.body;
  console.log(req.body)
try{
  const response = await generateTransactionReference(
    phoneNumber,
    amount,
    firstName,
    promotionId
  );

  if (response.status === "success") {
    res.status(201).json({ checkout_url: response.data.checkout_url });
  } else {
    res
      .status(400)
      .json({ error: "make sure that you entered all the required fields " });
  }

}catch(error){
console.log("error in generating transaction reference for promotion payment", error);
}
};

const getOrderPaymentPage = async (req, res) => {
  const {
    phoneNumber,
    amount,
    firstName,
    subAccountId,
    orderId,
    userId,
    restaurantId,
  } = req.body;

  console.log("pay now ", req.body);
  const order = await Order.findById(orderId);
  console.log("response", order);

  if (!order) return res.json({ error: "No order is found !" });

  if (!order.checkout_url) {
    const tx_ref = await chapa.genTxRef();
    const response = await chapa.initialize({
      phone_number: "0" + phoneNumber,
      first_name: firstName,
      amount: amount,
      currency: "ETB",
      tx_ref: tx_ref,
      callback_url: "http://localhost:3000/",
      split: {
        subaccounts: [{ id: subAccountId }],
      },
      meta: {
        type: "order",
        orderId,
        userId,
        restaurantId,
      },
    });
    if (response.status === "success") {
      order.checkout_url = response.data.checkout_url;
      await order.save();
      res.status(201).json({ checkout_url: response.data.checkout_url });
      return;
    }
  } else {
    res.status(201).json({ checkout_url: order.checkout_url });
    return;
  }

  res
    .status(400)
    .json({ error: "make sure that you entered all the required fields " });
};

const generateTransactionReference = async (
  phoneNumber,
  amount,
  firstName,
  promotionId
) => {
  const tx_ref = await chapa.genTxRef();
  const response = await chapa.initialize({
    phone_number: phoneNumber,
    first_name: firstName,
    amount: amount,
    currency: "ETB",
    tx_ref: tx_ref,
    callback_url: "http://localhost:3000/",
  });

  if (response.status === "success") {
    const promotion = await Promotion.findById(promotionId);
    promotion.tx_ref = tx_ref;
    await promotion.save();
  }
  return response;
};

const verify = async (tx_ref) => {
  console.log(tx_ref);
  const response = await chapa.verify({ tx_ref });
  response.data.status === "success" ? true : false;
};

const chapaWebhook = async (req, res) => {
  console.log("Web hook is called", req.body);
  const {
    orderId,
    userId,
    restaurantId,
    type,
    refundRequestId,
    subscriptionId,
  } = req.body.meta || {};

  const hash = crypto
    .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash == req.headers["x-chapa-signature"]) {
    // we know it is from the right source

    if (type === "order" && req.body.status === "success") {
      const order = await Order.findById(orderId)
        .populate("userId", "name nationalId phoneNumber username")
        .populate("items.item", "name price")
        .populate("deliveryPersonId", "username phoneNumber image")
        .populate("payment", "status paymentDate amount paymentMethod");

      if (order.status === "Processing") return; // as chapa my send the same webhook request multiple times
      order.tx_ref = req.body.reference;
      order.status = "Processing";
      await order.save();

      const payment = new Payment({
        orderId,
        userId,
        restaurantId,
        amount: parseInt(req.body.amount),
        status: "Paid",
      });

      const savedPayment = await payment.save();

      const userSocketId = socket_users[userId]?.socketId;
      if (userSocketId)
        io.to(userSocketId).emit("order_status_update", {
          message:
            "Dear Customer, Your order " +
            orderId +
            " is being processed. It will be on transit soon. Thank you for your patience !",
        });
      const restaurantSocketId = socket_users[order.restaurantId]?.socketId;
      if (restaurantSocketId)
        io.to(restaurantSocketId).emit("order_status_update", order);
      console.log("io sent ressockId", restaurantSocketId, userSocketId, order);
      sendNotification(
        order.userId,
        "Your order is under processing. It will be on transit soon. Thank you for your patience !"
      );
      return;
    } else if (type === "refund" && req.body.status === "success") {
      try {
        const order = await Order.findById(orderId);
        const tx_ref = order.tx_ref;
        const refund = await Refund.findById(refundRequestId);
        if (refund.status === "Initialized") return;

        const response = await axios.post(
          `https://api.chapa.co/v1/refund/${tx_ref}`,
          {
            reason: "customer requests refund !",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.data.status === "initiated") {
          refund.status = "Initiated";
          refund.tx_ref = req.body.tx_ref;
          await refund.save();
          order.status = "Refunded";
          await order.save();

          console.log("refund request is initiated");
          sendNotification(
            order.userId,
            "Your refund request has been initiated. It takes 3-5 days to be processed"
          );
        }
      } catch (error) {
        console.log(error);
      }
    } else if (type === "subscription" && req.body.status === "success") {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(now.getMonth() + 1);

      const subscription = new Subscription({
        restaurantId,
        startDate: now,
        amount: process.env.SUBSCRIPTION_PRICE,
        endDate: nextMonth,
        status: "Paid",
      });

      try {
        const restaurant = await Restaurant.findById(restaurantId);
        restaurant.status = "Active";
        await subscription.save();
        await restaurant.save();
      } catch (error) {
        console.log("error in saving subscription ", error);
      }
    } else if (req.body.status === "refunded") {
      const order = await Order.find({ tx_ref: req.body.tx_ref });
      order.status = "Cancelled";
      await order.save();
      const refund = await Refund.find({ tx_ref: req.body.tx_ref });
      refund.status = "Refunded";
      await refund.save();
      sendNotification(
        order.userId,
        "Your order has been refunded successfully !"
      );
    } else {
      activatePromotion(req, res);
      return;
    }
  }
};

const getRefundRequests = async (req, res) => {
  const { restaurantId } = req.params;

  try {
    if (!restaurantId) {
      return res.json({ message: "Restaurant ID is required" });
    }

    const refunds = await Refund.find({ restaurantId, status: "Requested" })
      .populate("userId", "phoneNumber username")
      .sort({ createdAt: -1 });

    if (!refunds.length) {
      return res.json({ message: "No Refund Requests are found " });
    }

    res.status(200).json({ refunds });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getRefundRequestsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.json({ message: "User ID is required" });
    }

    const refunds = await Refund.find({ userId });

    if (!refunds.length) {
      return res.json({ message: "No Refund Requests are found " });
    }

    res.status(200).json({ refunds });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const declineRefundRequest = async (req, res) => {
  const { refundRequestId } = req.params;

  try {
    if (!refundRequestId) {
      return res.json({ message: "refundRequestId  ID is required" });
    }

    const refund = await Refund.findById(refundRequestId);
    refund.status = "Declined";
    await refund.save();
    try {
      const token = await getFcmToken(refund.userId);
      const message = {
        token, // User's FCM token
        notification: {
          title: "Let's Eat Delivery",
          body: "Your refund request has been declined",
        },
        data: {
          customData: "custom data value",
        },
      };
      messaging.send(message);
    } catch (error) {
      console.log("error in sending fcm token/ user is not online", error);
    }

    return res.json({ message: "Refund Request is declined successfully ! " });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const approveRefundRequest = async (req, res) => {
  const { orderId, refundRequestId, phoneNumber, amount, restaurantName } =
    req.params;

  const refund = await Refund.findById(refundRequestId);
  if (!refund) return res.json({ error: "No refund is found !" });

  const tx_ref = await chapa.genTxRef();

  const response = await chapa.initialize({
    phone_number: "0987654321",
    first_name: restaurantName,
    amount: amount,
    currency: "ETB",
    tx_ref: tx_ref,
    callback_url: "http://localhost:3000/",
    meta: {
      type: "refund",
      refundRequestId,
      orderId,
    },
  });

  if (response.status === "success") {
    res.json({ checkout_url: response.data.checkout_url });
    return;
  }

  res.json({
    message: "Refund is Not Initialized. Please  Try again later ! ",
  });
};
const initiateRefund = async (req, res) => {
  const { userId, restaurantId, orderId, amount, reason, tx_ref, location } =
    req.body;

  if (!userId || !restaurantId || !orderId || !amount || !reason) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const refund = new Refund({
      userId,
      restaurantId,
      orderId,
      amount,
      reason,
      tx_ref,
      location,
    });

    const savedRefund = await refund.save();
    console.log("Refund request created:", savedRefund);
    res
      .status(201)
      .json({ message: "Refund request created", refund: savedRefund });
  } catch (error) {
    console.error("Error creating refund:", error);
    res
      .status(500)
      .json({ message: "Error creating refund", error: error.message });
  }
};

const sendNotification = async (userId, messageBody) => {
  try {
    const token = await getFcmToken(userId);
    const message = {
      token, // User's FCM token
      notification: {
        title: "Let's Eat Delivery",
        body: messageBody,
      },
      data: {
        customData: "custom data value",
      },
    };

    messaging.send(message);
  } catch (error) {
    console.log("error in sending fcm token/ user is not online", error);
  }
};
module.exports = {
  createPayment,
  getPaymentById,
  getAllPaymentsByUser,
  updatePaymentStatus,
  getAllPaymentsByRestaurant,
  getPaymentsByDateRange,
  verify,
  getOrderPaymentPage,
  getPromotionPaymentPage,
  chapaWebhook,
  getRefundRequests,
  declineRefundRequest,
  getRefundRequestsByUserId,
  approveRefundRequest,
  initiateRefund,
  sendNotification
};
