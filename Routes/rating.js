const express = require('express');
const { addRating, getRatingsForRestaurant } = require('../Controllers/rating');

const router = express.Router();

// Route to add/update a rating for a restaurant
// Expecting restaurantId in params, and userId, rating, review in the request body
router.post('/:restaurantId/add', addRating);

// Route to get all ratings for a specific restaurant
router.get('/:restaurantId/all', getRatingsForRestaurant);

module.exports = router;
