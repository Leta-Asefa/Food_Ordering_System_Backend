const express = require('express');
const router = express.Router();
const {addRating,getRatingsForItem} = require('../Controllers/itemRating');

// Expecting restaurantId in params, and userId, rating, review in the request body
router.post('/:itemId/add', addRating);

// Route to get all ratings for a specific restaurant
router.get('/:itemId/all', getRatingsForItem);

module.exports = router;
