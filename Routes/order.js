const express = require('express');
const { createOrder, getOrderById, getAllOrders, updateOrderStatus, deleteOrder, getRestaurantOrderById,getUserOrderById,updateDeliveryPerson,getByStatus, getOrderTrackingRoutes, getDeliveryPersonOrder, verifyOrder, getDeliveryHistory, sendOfferToDeliverPerson, offerNotAccepted } = require('../Controllers/order');
const router = express.Router();

// Create a new order
router.post('/add', createOrder);

// Get all orders
router.get('/all', getAllOrders);

// Get an order by ID
router.get('/:id', getOrderById);

// Get by Restaurant ID
router.get('/restaurant/:id', getRestaurantOrderById);

// Get by User ID
router.get('/user/:id', getUserOrderById);

//get by delivery person id
router.get('/assignedorder/:userId', getDeliveryPersonOrder);

//get delivery history
router.get('/deliveryhistory/:deliveryPersonId', getDeliveryHistory);

//Get Map route for an order
router.get('/maproute/:latitude/:longitude', getOrderTrackingRoutes);

// Get by either order status or payment status
router.get('/restaurant/:id/status/:status', getByStatus);


// Update order status
router.put('/:id/status', updateOrderStatus);

// Update delivery person
router.put('/:orderId/deliveryperson', updateDeliveryPerson);

//send delivery offer
router.get('/:orderId/deliveryoffer/:deliveryPersonId/:restaurantId', sendOfferToDeliverPerson);

//send order not accepted event to the restaurant admin
router.post('/:orderId/deliveryoffer/:restaurantId', offerNotAccepted);

router.get('/verify/:scannedValue/:deliveryPersonId', verifyOrder);


// Delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
