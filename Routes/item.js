const express = require('express');
const { createItem, getItems, getItemById, updateItem, deleteItem } = require('../Controller/item');

const router = express.Router();

// Route to create a new item
router.post('/', createItem);

// Route to get all items
router.get('/', getItems);

// Route to get a single item by ID
router.get('/:id', getItemById);

// Route to update an item by ID
router.put('/:id', updateItem);

// Route to delete an item by ID
router.delete('/:id', deleteItem);

module.exports = router;
