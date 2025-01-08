const express = require('express');
const { addPromotion, getPromotions, getPromotionById, updatePromotion, deletePromotion,getTierPriceList,activatePromotion } = require('../Controllers/promotion');
const router = express.Router();

// Add a new promotion
router.post('/add', addPromotion);

// Get all promotions
router.get('/get', getPromotions);

// Get all promotions
router.get('/tier/pricelist', getTierPriceList);


// Get a promotion by ID
router.get('/:restaurantId', getPromotionById);

// Update a promotion
router.put('/:id', updatePromotion);

// activate a promotion
router.post('/activate/:id', activatePromotion);

// Delete a promotion
router.delete('/:id', deletePromotion);

module.exports = router;
