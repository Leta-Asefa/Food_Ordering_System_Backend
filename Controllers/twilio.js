const twilio = require('twilio');
const { redisClient } = require("../redis/redis"); // make sure to import redisClient!

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to send OTP
const sendOtp = async (req, res) => {
    const {phoneNumber}=req.body
    console.log("Sending OTP to phoneNumber:", phoneNumber);

  try {
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
console.log(process.env.TWILIO_PHONE_NUMBER)

    // Send OTP via Twilio SMS
    // await client.messages.create({
    //   body: `Your OTP  to verify your Food Delivery App account is  ${otp}. It is only valid for 30 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
    //   to: phoneNumber,
    // });

    // Store OTP in Redis with expiration (30 minutes = 1800 seconds)
    await redisClient.sendCommand([
      "SETEX", 
      `otp:${phoneNumber}`, 
      "1800", // 30 minutes
      otp.toString()
    ]);

    console.log(`OTP ${otp} stored in Redis for phoneNumber ${phoneNumber}`);
    res.status(200).send({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send({ error: 'Failed to send OTP' });
  }
};

// Function to verify OTP
const verifyOtp = async (req, res) => {
    const {phoneNumber,otp}=req.body
 
  console.log("Verifying OTP for phoneNumber:", phoneNumber);

  try {
    // Get OTP from Redis
    const storedOtp = await redisClient.sendCommand([
      "GET", 
      `otp:${phoneNumber}`
    ]);

    if (!storedOtp) {
      return res.status(400).send({ error: 'OTP expired or not found' });
    }

    if (storedOtp === otp) {
      // Delete OTP after successful verification
      await redisClient.sendCommand(["DEL", `otp:${phoneNumber}`]);
      return res.status(200).send({ message: 'OTP Verified!' });
    } else {
      return res.status(400).send({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send({ error: 'Failed to verify OTP' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
