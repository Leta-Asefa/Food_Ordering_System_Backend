const { default: axios } = require("axios");
const { redisClient } = require("../redis/redis");
const { socket_users, io } = require("../socket/socket");

const updateLocation = async (req, res) => {
  const {
    userId,
    latitude,
    longitude,
    username,
    phoneNumber,
    image,
    employer,
    rating,
  } = req.body;

  if (
    !userId ||
    typeof latitude === "undefined" ||
    typeof longitude === "undefined"
  ) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  console.log("Rating ", rating, userId);

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
      `delivery_person:${userId}`,
    ]);

    const response2 = await redisClient.sendCommand([
      "HSET",
      `delivery_person_info:${userId}`,
      "username",
      username,
      "phoneNumber",
      phoneNumber,
      "image",
      image,
      "employer",
      employer,
      "rating",
      rating.toString(),
    ]);

    console.log(response2);

    console.log("removed from redis ", response, response2);

    res.json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Server error while updating location" });
  }
};

const getAllLocations = async (req, res) => {
  try {
    // Retrieve all delivery persons stored in the geospatial set
    const deliveryPeople = await redisClient.sendCommand([
      "ZRANGE",
      "delivery_locations",
      "0",
      "-1",
    ]);

    if (!deliveryPeople || deliveryPeople.length === 0) {
      return res.status(404).json({ message: "No locations found" });
    }

    const locations = {};

    // Fetch geolocation for each delivery person
    for (const person of deliveryPeople) {
      const coords = await redisClient.sendCommand([
        "GEOPOS",
        "delivery_locations",
        person,
      ]);

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
    const { longitude, latitude } = req.params; // Use query params instead of params

    console.log("lat long", req.params);
    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    let radius = 5;
    const maxRadius = 20;
    const increment = 3;
    let nearbyDrivers = [];

    while (radius <= maxRadius) {
      nearbyDrivers = await redisClient.sendCommand([
        "GEOSEARCH",
        "delivery_locations",
        "FROMLONLAT",
        lon.toString(),
        lat.toString(),
        "BYRADIUS",
        `${radius}`,
        "km",
        "ASC",
        "WITHCOORD",
      ]);

      if (nearbyDrivers && nearbyDrivers.length > 0) {
        break; // Stop searching when nearby drivers are found
      }

      console.log("Expanding search radius to", radius + increment);
      radius += increment;
    }
    // Transform response
    const deliveryPeople = nearbyDrivers.map((driver) => ({
      userId: driver[0].replace("delivery_person:", ""),
      longitude: driver[1][0],
      latitude: driver[1][1],
    }));

    // Fetch distance from HERE Maps API
    const distancePromises = deliveryPeople.map(async (driver) => {
      try {
        const userInfoArray = await redisClient.sendCommand([
          "HGETALL",
          `delivery_person_info:${driver.userId}`,
        ]);

        const userInfo = {};
        for (let i = 0; i < userInfoArray.length; i += 2) {
          userInfo[userInfoArray[i]] = userInfoArray[i + 1];
        }

        const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${latitude},${longitude}&destination=${driver.latitude},${driver.longitude}&transportMode=car&return=summary`;
        const response = await axios.get(requestUrl);
        const summary = response.data.routes[0].sections[0].summary;

        return {
          ...driver,
          distance: (summary.length / 1000).toFixed(2) + " km",
          distanceValue: Number((summary.length / 1000).toFixed(2)),
          duration: (summary.duration / 60).toFixed(1) + " min",
          durationValue: Number((summary.duration / 60).toFixed(2)),
          username: userInfo.username,
          phoneNumber: userInfo.phoneNumber,
          image: userInfo.image,
          employer: userInfo.employer,
          rating: userInfo.rating,
        };
      } catch (error) {
        // console.error("HERE API error:", error);
        return {
          ...driver,
          distance: "N/A",
          duration: "N/A",
          distanceValue: Infinity,
        };
      }
    });

    // Wait for all API requests to finish
    const driversWithDistances = await Promise.all(distancePromises);
    console.log(driversWithDistances);

    // Sort by actual route distance
    const sortedDrivers = driversWithDistances.sort(
      (a, b) => a.distanceValue - b.distanceValue
    );

    res.json({ nearbyDeliveryPeople: sortedDrivers });
  } catch (error) {
    // console.error("Error fetching nearby delivery people:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const realTimeUpdate = async (req, res) => {
  const { longitude, latitude, userId } = req.params;
  console.log("Update Location ", longitude, latitude, userId);
  if (!longitude || !latitude || !userId) return; // requirement is not met

  if (socket_users[userId]) {
    const customerSocketId = socket_users[userId].socketId;
    io.to(customerSocketId).emit("location_update", { latitude, longitude });
  } // if the customer is not connected to the socket, we don't need to do anything

  return;
};

const deliveryRoute = async (req, res) => {
    console.log("Entering deliver route /n--------------------------/n");
  const {
    deliveryPersonLatitude,
    deliveryPersonLongitude,
    restaurantLatitude,
    restaurantLongitude,
    destinationLatitude,
    destinationLongitude,
  } = req.params;
  console.log("delivery  route  ", 
    deliveryPersonLatitude,
    deliveryPersonLongitude,
    restaurantLatitude,
    restaurantLongitude,
    destinationLatitude,
    destinationLongitude
  );
  res.json({
    routeCoordinates:[
      { latitude: 11.59738, longitude: 37.39493 },
      { latitude: 11.5974, longitude: 37.39486 },
      { latitude: 11.59741, longitude: 37.39475 },
      { latitude: 11.59742, longitude: 37.39463 },
      { latitude: 11.59737, longitude: 37.39452 },
      { latitude: 11.59733, longitude: 37.39441 },
      { latitude: 11.5973, longitude: 37.39431 },
      { latitude: 11.59727, longitude: 37.39421 },
      { latitude: 11.59725, longitude: 37.39411 },
      { latitude: 11.59723, longitude: 37.394 },
      { latitude: 11.59719, longitude: 37.3939 },
      { latitude: 11.59714, longitude: 37.39379 },
      { latitude: 11.59712, longitude: 37.3937 },
      { latitude: 11.5971, longitude: 37.3936 },
      { latitude: 11.59706, longitude: 37.39351 },
      { latitude: 11.59701, longitude: 37.39342 },
      { latitude: 11.59699, longitude: 37.39334 },
      { latitude: 11.59697, longitude: 37.39326 },
      { latitude: 11.59695, longitude: 37.39317 },
      { latitude: 11.59694, longitude: 37.39308 },
      { latitude: 11.59693, longitude: 37.39299 },
      { latitude: 11.59693, longitude: 37.39291 },
      { latitude: 11.59694, longitude: 37.39283 },
      { latitude: 11.59696, longitude: 37.39275 },
      { latitude: 11.59697, longitude: 37.39268 },
      { latitude: 11.59699, longitude: 37.39261 },
      { latitude: 11.59701, longitude: 37.39254 },
      { latitude: 11.59704, longitude: 37.39248 },
      { latitude: 11.59707, longitude: 37.39241 },
      { latitude: 11.59709, longitude: 37.39235 },
      { latitude: 11.59711, longitude: 37.39229 },
      { latitude: 11.59713, longitude: 37.39223 },
      { latitude: 11.59714, longitude: 37.39217 },
      { latitude: 11.59714, longitude: 37.39211 },
      { latitude: 11.59714, longitude: 37.39205 },
      { latitude: 11.59714, longitude: 37.39199 },
      { latitude: 11.59713, longitude: 37.39193 },
      { latitude: 11.59711, longitude: 37.39188 },
      { latitude: 11.59709, longitude: 37.39182 },
      { latitude: 11.59706, longitude: 37.39176 },
      { latitude: 11.59703, longitude: 37.3917 },
      { latitude: 11.59699, longitude: 37.39164 },
      { latitude: 11.59695, longitude: 37.39159 },
      { latitude: 11.5969, longitude: 37.39154 },
      { latitude: 11.59685, longitude: 37.39149 },
      { latitude: 11.59679, longitude: 37.39145 },
      { latitude: 11.59674, longitude: 37.3914 },
      { latitude: 11.59668, longitude: 37.39136 },
      { latitude: 11.59661, longitude: 37.39131 },
      { latitude: 11.59655, longitude: 37.39127 },
      { latitude: 11.59649, longitude: 37.39122 },
      { latitude: 11.59642, longitude: 37.39118 },
      { latitude: 11.59636, longitude: 37.39113 },
      { latitude: 11.59629, longitude: 37.39108 },
      { latitude: 11.59622, longitude: 37.39103 },
      { latitude: 11.59615, longitude: 37.39098 },
      { latitude: 11.59608, longitude: 37.39092 },
      { latitude: 11.59601, longitude: 37.39087 },
      { latitude: 11.59594, longitude: 37.39082 },
      { latitude: 11.59587, longitude: 37.39077 },
      { latitude: 11.5958, longitude: 37.39072 },
      { latitude: 11.59573, longitude: 37.39067 },
      { latitude: 11.59566, longitude: 37.39062 },
      { latitude: 11.59559, longitude: 37.39057 },
      { latitude: 11.59552, longitude: 37.39052 },
      { latitude: 11.59545, longitude: 37.39047 },
      { latitude: 11.59538, longitude: 37.39042 },
      { latitude: 11.59531, longitude: 37.39037 },
      { latitude: 11.59524, longitude: 37.39032 }
    ]
    ,
      userLocation: { latitude: 11.59781, longitude: 37.39336 },
      destination:{ latitude: 11.59561, longitude: 37.39392 },
      restaurantLocation:{ latitude: 11.59741, longitude: 37.39349 }
  });
};

module.exports = {
  updateLocation,
  getAllLocations,
  getNearbyDeliveryPeople,
  realTimeUpdate,
  deliveryRoute,
};
