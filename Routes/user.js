const express = require('express');
const router = express.Router();
const {getAllUsers,signup,login,logout,changePassword,getByEmployer, updateUser, updateFavouriteRestaurant} = require('../Controllers/user');

router.get('/all',getAllUsers );
router.post('/signup',signup );
router.post('/login', login);
router.get('/logout', logout);
router.post('/changePassword', changePassword);
router.get('/employer/:employer', getByEmployer);
router.get('/favourite_restaurant/:userId/:restaurantId', updateFavouriteRestaurant);
router.put('/:userId', updateUser);

module.exports = router;