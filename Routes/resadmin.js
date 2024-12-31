const express = require('express');
const router = express.Router();
const {approve} = require('../Controllers/resadmin'); // Adjust the path to your controller

// Define the routes and map them to the controller functions
router.get('/approve/:id', approve);

module.exports = router;
