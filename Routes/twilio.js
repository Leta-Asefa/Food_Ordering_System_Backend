// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const {sendOtp,verifyOtp} = require('../Controllers/twilio');

// Route to send OTP
router.post('/sendOtp', sendOtp);

// Route to verify OTP
router.post('/verifyOtp', verifyOtp);

module.exports = router;
