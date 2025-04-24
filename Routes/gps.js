const express = require("express");
const router = express.Router();
const {
  getAllLocations,
  updateLocation,
  getNearbyDeliveryPeople,
  realTimeUpdate,
  deliveryRoute
} = require("../Controllers/gps");

router.post("/update_location", updateLocation);
router.get("/get_all_locations", getAllLocations);
router.get(
  "/get_nearby_locations/:latitude/:longitude",
  getNearbyDeliveryPeople
);
router.get("/realTimeUpdate/:latitude/:longitude/:userId", realTimeUpdate);
router.get("/deliveryRoute/:deliveryPersonLatitude/:deliveryPersonLongitude/:restaurantLatitude/:restaurantLongitude/:destinationLatitude/:destinationLongitude", deliveryRoute);

module.exports = router;
