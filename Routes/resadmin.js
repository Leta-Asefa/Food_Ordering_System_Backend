const express = require('express');
const router = express.Router();
const {approve, approveDeliveryPerson} = require('../Controllers/resadmin'); // Adjust the path to your controller

// Define the routes and map them to the controller functions
router.get('/approve/:id', approve);
router.get('/approve/deliveryperson/:id', approveDeliveryPerson);

module.exports = router;
