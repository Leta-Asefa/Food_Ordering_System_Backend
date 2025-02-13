const express = require('express');
const router = express.Router();
const {createRestaurant,getAllNearRestaurants,getAllRestaurants,getRestaurantById,updateRestaurant,deleteRestaurant,getNewUnapproved,login,getRestaurantPicturesById,getEstimatedTimeOfArrival} = require('../Controllers/restaurant'); // Adjust the path to your controller

// Define the routes and map them to the controller functions
router.post('/add', createRestaurant);
router.get('/all/near/:userLongitude/:userLatitude', getAllNearRestaurants);
router.get('/eta/:userLongitude/:userLatitude/:restaurantId', getEstimatedTimeOfArrival);
router.get('/all', getAllRestaurants);
router.get('/new/unapproved', getNewUnapproved);
router.get('/:id', getRestaurantById);
router.get('/:id/pictures', getRestaurantPicturesById);
router.put('/update/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);
router.post('/login',login)

module.exports = router;
