const express = require("express");
const router = express.Router();
const {
  createRestaurant,
  getAllNearRestaurants,
  getAllPopularRestaurants,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getNewUnapproved,
  login,
  logout,
  getRestaurantPicturesById,
  getEstimatedTimeOfArrival,
  updateRestaurantBankInformation,
  searchByKeyWord,
  getFavoriteRestaurantsByUserId,
  getAdminDashboardSummary,
  getSuperAdminDashboardSummary,
  getInactiveRestaurants,
} = require("../Controllers/restaurant"); // Adjust the path to your controller

// Define the routes and map them to the controller functions
router.post("/add", createRestaurant);
router.get("/all/near/:userLongitude/:userLatitude", getAllNearRestaurants);
router.get(
  "/all/popular/:userLongitude/:userLatitude",
  getAllPopularRestaurants
);
router.get(
  "/eta/:userLongitude/:userLatitude/:restaurantId",
  getEstimatedTimeOfArrival
);
router.post("/login", login);
router.get("/logout", logout);
router.get("/all", getAllRestaurants);
router.get("/search/:queryText", searchByKeyWord);
router.get("/new/unapproved", getNewUnapproved);
router.get("/deliquents", getInactiveRestaurants);
router.get("/:id", getRestaurantById);
router.get("/:id/pictures", getRestaurantPicturesById);
router.get("/summary/superadmin/:days", getSuperAdminDashboardSummary);
router.get("/summary/:restaurantId/:days", getAdminDashboardSummary);
router.put("/update/:id", updateRestaurant);
router.put("/update/bankinfo/:id", updateRestaurantBankInformation);
router.post(
  "/favorite/:userLatitude/:userLongitude",
  getFavoriteRestaurantsByUserId
);
router.delete("/:id", deleteRestaurant);

module.exports = router;
