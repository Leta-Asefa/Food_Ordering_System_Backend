const express = require('express');
const {
  createPayment,
  getPaymentById,
  getAllPaymentsByUser,
  updatePaymentStatus,
  getAllPaymentsByRestaurant,
  getPaymentsByDateRange
} = require('../Controllers/payment');

const router = express.Router();

// Create a new payment
router.post('/add', createPayment);

// Get payment by ID
router.get('/:id', getPaymentById);

// Get all payments for a user
router.get('/user/:userId', getAllPaymentsByUser);

// Update payment status
router.put('/:id/status', updatePaymentStatus);

// routes/paymentRoutes.js
router.get('/restaurant/:restaurantId', getAllPaymentsByRestaurant);

// routes/paymentRoutes.js
router.get('/restaurant/:restaurantId/:startDate/:endDate', getPaymentsByDateRange);


module.exports = router;
