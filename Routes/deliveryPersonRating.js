const express = require('express');
const { addRating, getRatingsForDeliveryPerson } = require('../Controllers/deliveryPersonRating');

const router = express.Router();

// Route to add/update a rating for a restaurant
// Expecting restaurantId in params, and userId, rating, review in the request body
router.post('/:deliveryPersonId/add', addRating);

// Route to get all ratings for a specific restaurant
router.get('/:deliveryPersonId/all', getRatingsForDeliveryPerson);

module.exports = router;
