const express = require("express");
const {
  createPayment,
  getPaymentById,
  getAllPaymentsByUser,
  updatePaymentStatus,
  getAllPaymentsByRestaurant,
  getPaymentsByDateRange,
  getPromotionPaymentPage,
  getOrderPaymentPage,
  getRefundRequests,
  declineRefundRequest,
  getRefundRequestsByUserId,
  approveRefundRequest
} = require("../Controllers/payment");

const router = express.Router();

// Create a new payment
router.post("/add", createPayment);

// Get payment by ID
router.get("/:id", getPaymentById);

// Get all payments for a user
router.get("/user/:userId", getAllPaymentsByUser);

// Update payment status
router.put("/:id/status", updatePaymentStatus);

// routes/paymentRoutes.js
router.get("/restaurant/:restaurantId", getAllPaymentsByRestaurant);

// routes/paymentRoutes.js
router.get(
  "/restaurant/:restaurantId/:startDate/:endDate",
  getPaymentsByDateRange
);

router.post("/test", getPromotionPaymentPage);

router.post("/getOrderPaymentPage", getOrderPaymentPage);

router.get("/refundRequests/restaurant/:restaurantId", getRefundRequests);
router.get("/refundRequests/user/:userId", getRefundRequestsByUserId);
router.get("/declineRefundRequest/:refundRequestId", declineRefundRequest);
router.get("/approveRefundRequest/:phoneNumber/:restaurantName/:amount/:orderId/:refundRequestId", approveRefundRequest);

module.exports = router;
