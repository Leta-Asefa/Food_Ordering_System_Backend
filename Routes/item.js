const express = require('express');
const router = express.Router();
const {createItem,getAllItems,getItemById,updateItemById,deleteItemById} = require('../Controllers/item');

// Create a new item
router.post('/add',   createItem);

// Get all items
router.get('/all',   getAllItems);

// Get an item by ID
router.get('/:id',   getItemById);

// Update an item by ID
router.put('/:id',   updateItemById);

// Delete an item by ID
router.delete('/:id',   deleteItemById);

module.exports = router;
