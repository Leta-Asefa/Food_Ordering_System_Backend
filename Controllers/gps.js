const { default: axios } = require('axios');
const {redisClient}= require('../app')

const updateLocation = async (req, res) => {
    console.log("Accepted !")
    const { userId, latitude, longitude } = req.body;
    console.log('userId:', userId, 'latitude:', latitude, 'longitude:', longitude); // Debugging log

    if (!userId || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
        return res.status(400).json({ message: "Missing parameters" });
    }

    try {
        // Ensure latitude and longitude are numbers
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ message: "Invalid latitude or longitude" });
        }

        // Store the geolocation in Redis using sendCommand
        const response = await redisClient.sendCommand([
            "GEOADD",
            "delivery_locations",
            lon.toString(),
            lat.toString(),
            `delivery_person:${userId}`
        ]);


        


        res.json({ message: "Location updated successfully" });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Server error while updating location" });
    }
};

  
const getAllLocations = async (req, res) => {
    try {
        // Retrieve all delivery persons stored in the geospatial set
        const deliveryPeople = await redisClient.sendCommand(["ZRANGE", "delivery_locations", "0", "-1"]);

        if (!deliveryPeople || deliveryPeople.length === 0) {
            return res.status(404).json({ message: "No locations found" });
        }

        const locations = {};

        // Fetch geolocation for each delivery person
        for (const person of deliveryPeople) {
            const coords = await redisClient.sendCommand(["GEOPOS", "delivery_locations", person]);
            
            if (coords && coords.length > 0) {
                const [longitude, latitude] = coords[0]; // Extract lat/lon
                
                locations[person.replace("delivery_person:", "")] = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                };
            }
        }

        res.json(locations);
    } catch (error) {
        console.error("Error fetching all locations:", error);
        res.status(500).json({ message: "Server error" });
    }
};



const getNearbyDeliveryPeople = async (req, res) => {
    try {
        const { latitude, longitude } = req.params; // Use query params instead of params

        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and longitude are required" });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ message: "Invalid latitude or longitude" });
        }

        // Fetch nearby delivery people within 5 km using correct GEOSEARCH syntax
        const nearbyDrivers = await redisClient.sendCommand([
            "GEOSEARCH",
            "delivery_locations",
            "FROMLONLAT",  // Corrected syntax: "FROMLONLAT" instead of "FROMCOORD"
            lon.toString(),
            lat.toString(),
            "BYRADIUS",
            "5", "km",
            "ASC",  // Sort results by nearest first
            "WITHCOORD"
        ]);

        if (!nearbyDrivers || nearbyDrivers.length === 0) {
            return res.json({ message: "No nearby delivery people found" });
        }

           // Transform response
           const deliveryPeople = nearbyDrivers.map(driver => ({
            userId: driver[0].replace("delivery_person:", ""),
            longitude: driver[1][0],
            latitude: driver[1][1]
        }));

        // Fetch distance from HERE Maps API
        const distancePromises = deliveryPeople.map(async (driver) => {
            try {
                const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${latitude},${longitude}&destination=${driver.latitude},${driver.longitude}&transportMode=car&return=summary`;

                const response = await axios.get(requestUrl);
                console.log(requestUrl)
                console.log(response.data.routes[0].sections[0].summary)
                const summary = response.data.routes[0].sections[0].summary;

                return {
                    ...driver,
                    distance: (summary.length / 1000).toFixed(2) + " km",
                    distanceValue:Number( (summary.length / 1000).toFixed(2) ),
                    duration: (summary.duration / 60).toFixed(1) + " min",
                    durationValue:Number( (summary.duration / 60).toFixed(2) )
                };
            } catch (error) {
                console.error("HERE API error:", error);
                return { ...driver, distance: "N/A", duration: "N/A", distanceValue: Infinity };
            }
        });

        // Wait for all API requests to finish
        const driversWithDistances = await Promise.all(distancePromises);

        // Sort by actual route distance
        const sortedDrivers = driversWithDistances.sort((a, b) => a.distanceValue - b.distanceValue);

        res.json({ nearbyDeliveryPeople: sortedDrivers });

    } catch (error) {
        console.error("Error fetching nearby delivery people:", error);
        res.status(500).json({ message: "Server error" });
    }
};


  
  


module.exports = {
    updateLocation,
    getAllLocations,
    getNearbyDeliveryPeople

};