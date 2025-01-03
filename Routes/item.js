const express = require('express');
const router = express.Router();
const {createItem,getAllItems,getItemById,updateItemById,deleteItemById,getAllFood,getAllDrink,getAllCatering} = require('../Controllers/item');

// Create a new item
router.post('/add',   createItem);

// Get all items
router.get('/all',   getAllItems);

// Get all food
router.get('/food',   getAllFood);

// Get all drink
router.get('/drink',   getAllDrink);


// Get all catering packages
router.get('/catering',   getAllCatering);


// Get an item by ID
router.get('/:id',   getItemById);

// Update an item by ID
router.put('/:id',   updateItemById);

// Delete an item by ID
router.delete('/:id',   deleteItemById);

module.exports = router;
