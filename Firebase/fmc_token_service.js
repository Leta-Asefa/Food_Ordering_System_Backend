const { redisClient } = require('../redis/redis');

const saveFcmToken = async (req, res) => {

    const { userId, fcmToken } = req.body;
    if (!userId || !fcmToken) return;
    
    console.log("fcm called !", fcmToken);

    try {
        await redisClient.set(`fcm_token:${userId}`, fcmToken, "EX", 60 * 60 * 24 * 7); // Expires in 7 days
        return res.json({ status: "success" });
    } catch (error) {
        console.error("❌ Error saving FCM token:", error);
        
    }
};


const getFcmToken = async (userId) => {
    try {
       const token= await redisClient.get(`fcm_token:${userId}`);
        return token
    } catch (error) {
        console.error("❌ Error fetching FCM token:", error);
        return null;
    }
};


const deleteFcmToken = async (userId) => {
    try {
        await redisClient.del(`fcm_token:${userId}`);
        console.log(`❌ FCM token for user ${userId} deleted from Redis`);
    } catch (error) {
        console.error("❌ Error deleting FCM token:", error);
    }
};

module.exports = { saveFcmToken, getFcmToken, deleteFcmToken };
