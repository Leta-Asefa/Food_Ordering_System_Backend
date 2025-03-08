const {redisClient}= require('../app')

// Endpoint to receive location updates
const updateLocation= async (req, res) => {
    const { userId, latitude, longitude } = req.body;
  
    if (!userId || !latitude || !longitude) {
    }
  
    // Store in Redis (Expire after 10 minutes)
    await redisClient.setEx(`delivery_person:${userId}`, 600, JSON.stringify({
        latitude,
        longitude,
        timestamp: Date.now()
    }));
  
  
    res.json({ message: "Location updated" });
  };
  
  
  // Endpoint to fetch all locations
 const getAllLocations=async (req, res) => {
    try {
        const keys = await redisClient.keys("delivery_person:*");
  
        if (keys.length === 0) {
            return res.status(404).json({ message: "No locations found" });
        }
  
        const locations = {};
        for (const key of keys) {
            const locationData = await redisClient.get(key);
            locations[key.replace("delivery_person:", "")] = JSON.parse(locationData);
        }
  
        
        res.json(locations);
    } catch (error) {
        console.error("Error fetching all locations:", error);
        res.status(500).json({ message: "Server error" });
    }
  };
  
  


module.exports = {
    updateLocation,
    getAllLocations

};