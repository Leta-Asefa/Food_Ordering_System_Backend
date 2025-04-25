const express = require('express');
const router = express.Router();
const {getAllUsers,signup,login,logout,changePassword,getByEmployer, updateUser, updateFavouriteRestaurant, getAllDeliveryPeople, getAllUnapprovedPeople} = require('../Controllers/user');

router.get('/all',getAllUsers );
router.post('/signup',signup );
router.post('/login', login);
router.get('/logout', logout);
router.post('/changePassword', changePassword);
router.get('/employer/:employer', getByEmployer);
router.get('/favourite_restaurant/:userId/:restaurantId', updateFavouriteRestaurant);
router.put('/:userId', updateUser);
router.get('/delivery_people', getAllDeliveryPeople);
router.get('/unapproved_delivery_people', getAllUnapprovedPeople);


module.exports = router;