const express = require('express');
const { addPromotion, getPromotions, getPromotionById, updatePromotion, deletePromotion } = require('../Controllers/promotion');
const router = express.Router();

// Add a new promotion
router.post('/add', addPromotion);

// Get all promotions
router.get('/get', getPromotions);

// Get a promotion by ID
router.get('/:id', getPromotionById);

// Update a promotion
router.put('/:id', updatePromotion);

// Delete a promotion
router.delete('/:id', deletePromotion);

module.exports = router;
