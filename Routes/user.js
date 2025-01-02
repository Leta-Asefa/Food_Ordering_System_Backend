const express = require('express');
const router = express.Router();
const {getAllUsers,signup,login,logout,changePassword,getByEmployer} = require('../Controllers/user');

router.get('/all',getAllUsers );
router.post('/signup',signup );
router.post('/login', login);
router.get('/logout', logout);
router.post('/changePassword', changePassword);
router.get('/employer/:employer', getByEmployer);

module.exports = router;