const express = require('express');
const { createOrder, getOrderById, getAllOrders, updateOrderStatus, deleteOrder, getRestaurantOrderById,getUserOrderById } = require('../Controllers/order');
const router = express.Router();

// Create a new order
router.post('/add', createOrder);

// Get all orders
router.get('/all', getAllOrders);

// Get an order by ID
router.get('/:id', getOrderById);

router.get('/restaurant/:id', getRestaurantOrderById);

router.get('/user/:id', getUserOrderById);



// Update order status
router.put('/:id/status', updateOrderStatus);

// Delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
