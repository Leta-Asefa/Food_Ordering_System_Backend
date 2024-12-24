const express = require('express');
const { createOrder, getOrderById, getAllOrders, updateOrderStatus, deleteOrder } = require('../Controllers/order');
const router = express.Router();

// Create a new order
router.post('/add', createOrder);

// Get all orders
router.get('/all', getAllOrders);

// Get an order by ID
router.get('/:id', getOrderById);

// Update order status
router.put('/:id/status', updateOrderStatus);

// Delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
