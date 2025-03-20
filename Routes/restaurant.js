const express = require('express');
const router = express.Router();
const {createRestaurant,getAllNearRestaurants,getAllPopularRestaurants,getAllRestaurants,getRestaurantById,updateRestaurant,deleteRestaurant,getNewUnapproved,login,getRestaurantPicturesById,getEstimatedTimeOfArrival,updateRestaurantBankInformation} = require('../Controllers/restaurant'); // Adjust the path to your controller

// Define the routes and map them to the controller functions
router.post('/add', createRestaurant);
router.get('/all/near/:userLongitude/:userLatitude', getAllNearRestaurants);
router.get('/all/popular/:userLongitude/:userLatitude', getAllPopularRestaurants);
router.get('/eta/:userLongitude/:userLatitude/:restaurantId', getEstimatedTimeOfArrival);
router.get('/all', getAllRestaurants);
router.get('/new/unapproved', getNewUnapproved);
router.get('/:id', getRestaurantById);
router.get('/:id/pictures', getRestaurantPicturesById);
router.put('/update/:id', updateRestaurant);
router.put('/update/bankinfo/:id', updateRestaurantBankInformation);
router.delete('/:id', deleteRestaurant);
router.post('/login',login)

module.exports = router;
