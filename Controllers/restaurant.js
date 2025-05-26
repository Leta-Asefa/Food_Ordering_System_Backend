const { default: axios } = require("axios");
const Restaurant = require("../Models/Restaurant"); // Adjust the path to your Restaurant model
const Order = require("../Models/Order");
const Refund = require("../Models/Refund");
const { io } = require("../socket/socket");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const AppError = require("../GlobalErrors/AppError");
const { chapa } = require("../Chapa/chapa");
const Item = require("../Models/Item");
const Subscription = require("../Models/Subscription");
const User = require("../Models/User");

function createToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
}

const getAdminDashboardSummary = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.params.restaurantId);
    const days = parseInt(req.params.days) || 30;
    const today = new Date();
    const lastNDays = new Date(today);
    lastNDays.setDate(today.getDate() - days);

    // Orders & income over time
    const ordersOverTime = await Order.aggregate([
      { $match: { createdAt: { $gte: lastNDays }, restaurantId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          income: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Order status distribution (filtered by date)
    const orderStatus = await Order.aggregate([
      { $match: { restaurantId, createdAt: { $gte: lastNDays } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Refunds (filtered by date)
    const refunds = await Refund.aggregate([
      { $match: { restaurantId, createdAt: { $gte: lastNDays } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Top sales (by item, filtered by date)
    const topSales = await Order.aggregate([
      { $match: { restaurantId, createdAt: { $gte: lastNDays } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "itemDetails",
        },
      },
      { $unwind: "$itemDetails" },
      {
        $project: {
          _id: 0,
          itemName: "$itemDetails.name",
          quantity: "$totalQuantity",
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      ordersOverTime: ordersOverTime.map((o) => ({
        date: o._id,
        count: o.count,
      })),
      incomeOverTime: ordersOverTime.map((o) => ({
        date: o._id,
        income: o.income,
      })),
      totalOrders: ordersOverTime.reduce((acc, cur) => acc + cur.count, 0),
      totalIncome: ordersOverTime.reduce((acc, cur) => acc + cur.income, 0),
      refundCount: refunds[0]?.count || 0,
      refundTotal: refunds[0]?.total || 0,
      topSales,
      orderStatusDistribution: Object.fromEntries(
        orderStatus.map((o) => [o._id, o.count])
      ),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching summary." });
  }
};

const getSuperAdminDashboardSummary = async (req, res) => {
  const days = parseInt(req.params.days, 10);

  try {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // New restaurants in the last N days
    const newRestaurants = await Restaurant.countDocuments({
      createdAt: { $gte: fromDate },
    });
    console.log("new restaurants", fromDate);

    // New delivery people in the last N days
    const newDeliveryPeople = await User.countDocuments({
      role: "delivery",
      createdAt: { $gte: fromDate },
    });

    // Active users
    const activeUsers = await User.countDocuments({ isActive: true });

    // Alerts (example: restaurants with status 'Delinquent')
    const alerts = await Restaurant.countDocuments({ status: "Deliquent" });

    // Revenue by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getDay() - days);
    sixMonthsAgo.setDate(1); // start from the beginning of that month

    const revenueRaw = await Subscription.aggregate([
      {
        $match: {
          status: "Paid",
          startDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: "$startDate" },
          revenue: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const revenueData = revenueRaw.map((entry) => ({
      month: months[entry._id - 1],
      revenue: entry.revenue,
    }));

    // Subscription summary
    const paidCount = await Subscription.countDocuments({ status: "Paid" });
    const unpaidCount = await Subscription.countDocuments({
      status: "Not Paid",
    });

    const subscriptionData = [
      { name: "Paid", value: paidCount },
      { name: "Unpaid", value: unpaidCount },
    ];

    return res.json({
      stats: {
        newRestaurants,
        newDeliveryPeople,
        activeUsers,
        alerts,
      },
      revenueData,
      subscriptionData,
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
};

// Create a new restaurant
const createRestaurant = async (req, res) => {
  try {
    const newRestaurant = new Restaurant(req.body);
    await newRestaurant.save();
    const subscription = new Subscription({
      restaurantId: newRestaurant._id,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month plan
      status: "Not Paid",
    });

    await subscription.save();

    const newUnapprovedRestaurants = await Restaurant.find({
      isApproved: false,
      status: "New",
    });
    io.to("super_admin").emit("newapplicants", newUnapprovedRestaurants);

    res.status(201).json({ restaurant: newRestaurant });
  } catch (err) {
    let errors = {
      name: "",
      location: "",
      opened: "",
      image: "",
      cuisine: "",
      priceRange: "",
      rating: "",
      address: "",
      contact: "",
      isApproved: "",
      licenseImage: "",
      status: "",
      password: "",
    };

    if (err.cause) {
      if (err.cause.code === 11000) {
        // Handle unique constraint errors
        const field = Object.keys(err.cause.keyValue)[0];
        errors[field] = `This ${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is already registered !`;
      }
    } else if (err instanceof mongoose.Error.ValidationError) {
      // Handle Mongoose validation errors
      Object.values(err.errors).forEach(({ properties }) => {
        errors[properties.path] = properties.message;
      });
    } else {
      // Log the error and set a generic error message
      console.error("Unhandled error:---------", err);
      errors.general = "An unknown error occurred";
    }

    console.log(errors);

    res.json({ errors });
  }
};

// Get all restaurants in 10km radius
const getAllRestaurants = async (req, res) => {
  const { userLongitude, userLatitude } = req.params;
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurants", error });
  }
};

// Get all Near restaurants in 10km radius
const getAllNearRestaurants = async (req, res) => {
  const { userLongitude, userLatitude } = req.params;
  try {
    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLongitude, userLatitude],
          },
          $maxDistance: 10000, // 10 km radius
        },
      },
    });

    const unsorted = [];

    for (const restaurant of restaurants) {
      const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}&transportMode=pedestrian&return=summary`;

      const response = await axios.get(requestUrl);
      const distance =
        (response.data.routes[0].sections[0].summary.length / 1000).toFixed(2) +
        " km";
      const distanceValue =
        response.data.routes[0].sections[0].summary.length / 1000;
      const duration =
        (response.data.routes[0].sections[0].summary.duration / 60).toFixed(1) +
        " min";
      const durationValue = (
        response.data.routes[0].sections[0].summary.duration / 60
      ).toFixed(1);

      unsorted.push({
        restaurant,
        distance,
        duration,
        distanceValue,
        durationValue,
      });
    }

    const sortedByDistance = unsorted.sort(
      (a, b) => a.distanceValue - b.distanceValue
    );

    res.status(200).json(sortedByDistance);
  } catch (error) {
    res.status(500).json({ error: "Error fetching restaurants", error });
  }
};

const getAllPopularRestaurants = async (req, res) => {
  const { userLongitude, userLatitude } = req.params;
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 27);

    // Step 1: Find the top 15 restaurants with the most orders in the last 7 days
    const topRestaurants = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } }, // Filter last 7 days
      { $group: { _id: "$restaurantId", orderCount: { $sum: 1 } } }, // Count orders per restaurant
      { $sort: { orderCount: -1 } }, // Sort by order count (descending)
      { $limit: 15 }, // Get top 15 restaurants
    ]);

    // Extract restaurant IDs
    const restaurantIds = topRestaurants.map((r) => r._id);

    // Step 2: Fetch restaurant details sorted by rating
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
      .sort({ rating: -1 }) // Sort by highest rating
      .lean(); // Optimize query by returning plain JavaScript objects

    const unsorted = []; //unsorted by distance rather by rating

    for (const restaurant of restaurants) {
      const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}&transportMode=pedestrian&return=summary`;

      const response = await axios.get(requestUrl);
      const distance =
        (response.data.routes[0].sections[0].summary.length / 1000).toFixed(2) +
        " km";
      const distanceValue =
        response.data.routes[0].sections[0].summary.length / 1000;
      const duration =
        (response.data.routes[0].sections[0].summary.duration / 60).toFixed(1) +
        " min";
      const durationValue = (
        response.data.routes[0].sections[0].summary.duration / 60
      ).toFixed(1);

      unsorted.push({
        restaurant,
        distance,
        duration,
        distanceValue,
        durationValue,
      });
    }

    res.status(200).json(unsorted);
  } catch (error) {
    console.error("Error fetching popular restaurants:", error);
    res
      .status(500)
      .json({ message: "Error fetching popular restaurants", error });
  }
};

const getEstimatedTimeOfArrival = async (req, res) => {
  const { userLongitude, userLatitude, restaurantId } = req.params;
  try {
    const restaurant = await Restaurant.findById(restaurantId);

    const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}&transportMode=pedestrian&return=summary`;

    const response = await axios.get(requestUrl);

    let eta = 0;
    response.data.routes[0].sections.forEach((section) => {
      eta = eta + section.summary.duration;
    });

    eta = (eta / 60).toFixed(1);

    distanceValue = (
      response.data.routes[0].sections[0].summary.length / 1000
    ).toFixed(2);

    res
      .status(200)
      .json({
        durationValue: eta,
        distanceValue,
        duration: `${eta} Min`,
        distance: `${distanceValue} Km`,
        restaurant,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching restaurants", error });
  }
};

// Get all new unapproved restaurants
const getNewUnapproved = async (req, res) => {
  console.log("request recieved .../getNewUnapproved ");
  try {
    const newUnapprovedRestaurants = await Restaurant.find({
      isApproved: false,
      status: "New",
    });
    res.status(200).json(newUnapprovedRestaurants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurants", error });
  }
};

const getInactiveRestaurants = async (req, res) => {
  try {
    const now = new Date();

    // Get expired subscriptions
    const expiredSubscriptions = await Subscription.find({
      endDate: { $lt: now },
    }).select("restaurantId endDate");

    const expiredRestaurantIds = expiredSubscriptions.map(
      (sub) => sub.restaurantId
    );

    // Fetch restaurants whose subscriptions are expired
    const restaurants = await Restaurant.find({
      _id: { $in: expiredRestaurantIds },
    });

    // Map through restaurants and attach how many days have passed
    const result = restaurants.map((restaurant) => {
      const sub = expiredSubscriptions.find(
        (sub) => sub.restaurantId.toString() === restaurant._id.toString()
      );
      const daysPassed = Math.floor(
        (now - new Date(sub.endDate)) / (1000 * 60 * 60 * 24)
      );

      return {
        ...restaurant.toObject(),
        daysSinceSubscriptionExpired: daysPassed,
      };
    });

    console.log("Inactive Restaurants:", result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching inactive restaurants:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get a single restaurant by ID
const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ contact: req.params.id });
    if (!restaurant) {
      next(new AppError("Restaurant with this id is not found", 404));
    }
    res.status(200).json(restaurant);
  } catch (error) {
    next(new AppError("Internal Problem", 500));
  }
};

// Get a single restaurant by ID
const getRestaurantPicturesById = async (req, res, next) => {
  try {
    const pictures = await Restaurant.findById(req.params.id).select(
      "pictures"
    );
    if (!pictures) {
      next(new AppError("Restaurant with this id is not found", 404));
    }
    res.status(200).json(pictures);
  } catch (error) {
    next(new AppError("Internal Problem", 500));
  }
};

// Update a restaurant by ID
const updateRestaurant = async (req, res,next) => {
  const {
    location,
    contact,
    name,
    address,
    isApproved,
    licenseImage,
    password,
    cuisine,
    image,
    opened,
    priceRange,
    pictures,
    _id,
  } = req.body; // Allowed fields to update
  
  console.log("update restaurant", req.body);
    
  if (!_id) {
    return next(new AppError("User ID is required", 400));
  }

  try {
    const restaurant = await Restaurant.findById(_id);
    if (!restaurant) {
      return next(new AppError("User not found", 404));
    }

    // Update only provided fields
    if (location !== undefined) restaurant.location = location;
    if (name) restaurant.name = name;
    if (address) restaurant.address = address;
    if (licenseImage) restaurant.licenseImage = licenseImage;
    if (image) restaurant.image = image;
    if (priceRange) restaurant.priceRange = priceRange;
    if (pictures) restaurant.pictures = pictures;
    if (pictures) restaurant.pictures = pictures;
    if (contact) restaurant.contact = contact;

    await restaurant.save();

    console.log("Restaurant ", restaurant);

    res.json({ message: "Restaurant updated successfully" });
  } catch (err) {
   console.log("update restaurant error", err);
   
  // Check top-level error
  if (err.code === 11000 && err.keyPattern?.contact) {
    return res.json({ error: "Phone number already exists" });
  }

  // Check nested errorResponse (MongoDB driver)
  if (err.errorResponse?.code === 11000 && err.errorResponse?.keyPattern?.contact) {
    return res.json({ error: "Phone number already exists" });
  }

  // Check nested cause (Mongoose 7+)
  if (err.cause?.code === 11000 && err.cause?.keyPattern?.contact) {
    return res.json({ error: "Phone number already exists" });
  }

  // Fallback: generic error
  return res.status(500).json({ error: err.message || "Server error" })
  }
};

// Update a restaurant bank info
const updateRestaurantBankInformation = async (req, res) => {
  const { id } = req.params;
  const { bankName, bankAccountName, bankAccountNumber } = req.body;
  console.log('bank info', req.body);
  const bankCode = await getBankIdByName(bankName);
  let subAccountId = null;
  try {
    const subAccountData = {
      business_name: bankAccountName,
      account_name: bankAccountName,
      bank_code: bankCode, // Replace with the actual bank code
      account_number: bankAccountNumber,
      split_type: "percentage", // or "flat"
      split_value: 0.02, // 10% if split_type is percentage
    };

    try {
      const response = await axios.post(
        "https://api.chapa.co/v1/subaccount",
        subAccountData,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          },
        }
      );
      console.log(response);

      subAccountId = response.data.data.subaccount_id;
    } catch (error) {
      console.log("Error while creating subaccount ", error.response?.data); // Log error response from chapa
      res.json({
        error: "Account is not added , please try again a few minutes later !",
      });
      return;
    }

    const restaurant = await Restaurant.findOne({ contact: id });
    restaurant.bankName = bankName;
    restaurant.bankAccountName = bankAccountName;
    restaurant.bankAccountNumber = bankAccountNumber;
    restaurant.subAccountId = subAccountId;
    await restaurant.save();
    res.status(200).json({ message: "Bank info updated successfully !" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating restaurant", error });
  }
};

const getBankIdByName = async (bankName) => {
  try {
    const response = await axios.get("https://api.chapa.co/v1/banks", {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const banks = response.data.data; // Assuming the bank list is under `data`
    const bank = banks.find(
      (b) => b.name.toLowerCase() === bankName.toLowerCase()
    );

    if (!bank) {
      throw new Error("Bank not found");
    }

    return bank.id; // Bank ID needed for sub-account creation
  } catch (error) {
    console.error(
      "Error fetching banks:",
      error.response ? error.response.data : error.message
    );
  }
};

// Search Restaurants, Items ... through keyword
const searchByKeyWord = async (req, res, next) => {
  const queryText = req.params.queryText;
  const regex = new RegExp(`.*${queryText}.*`, "i"); // Case-insensitive regex

  console.log("Query Text", queryText);

  try {
    const restaurants = await Restaurant.find({
      $or: [{ name: regex }, { address: regex }, { cuisine: regex }],
    }).select("name image cuisine location");

    const items = await Item.find({
      $or: [
        { name: regex },
        { description: regex },
        { allergensInformation: regex },
        { type: regex },
      ],
    }).select("name image description price restaurantId");

    res.status(200).json({ result: [...restaurants, ...items] });
  } catch (error) {
    next(new AppError("Internal Problem", 500)); // Ensure next() is available
  }
  
};

// Delete a restaurant by ID
const deleteRestaurant = async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting restaurant", error });
  }
};

// Delete a restaurant by ID
const getFavoriteRestaurantsByUserId = async (req, res) => {
  let restaurantsIdList = req.body.restaurantsIdList;
  console.log("fav list id", restaurantsIdList);
  const { userLatitude, userLongitude } = req.params;

  try {
    const restaurants = await Restaurant.find({
      _id: { $in: restaurantsIdList },
    });

    const unsorted = [];

    for (const restaurant of restaurants) {
      const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}&transportMode=pedestrian&return=summary`;

      const response = await axios.get(requestUrl);
      const distance =
        (response.data.routes[0].sections[0].summary.length / 1000).toFixed(2) +
        " km";
      const distanceValue =
        response.data.routes[0].sections[0].summary.length / 1000;
      const duration =
        (response.data.routes[0].sections[0].summary.duration / 60).toFixed(1) +
        " min";
      const durationValue = (
        response.data.routes[0].sections[0].summary.duration / 60
      ).toFixed(1);

      unsorted.push({
        restaurant,
        distance,
        duration,
        distanceValue,
        durationValue,
      });
    }

    const sortedByDistance = unsorted.sort(
      (a, b) => a.distanceValue - b.distanceValue
    );

    res.status(200).json({ restaurants: sortedByDistance });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting restaurant", error });
  }
};

const login = async (req, res) => {
  const { phoneNumber, password } = req.body;
  console.log("login restaurant hit",phoneNumber, password);
  try {
    const restaurant = await Restaurant.login(phoneNumber, password);
    const token = createToken(restaurant._id);

    res.cookie("jwt", token);
    res.json({ restaurant, token });
  } catch (err) {
    console.log("error " + err);
    res.json({ error: err.message });
  }
};
const logout = (req, res,) => {
  console.log("logout restaurant hit");
  res.cookie("jwt", "");
  res.json({ status: "logged out successfully !" });
};



module.exports = {
  createRestaurant,
  getAllRestaurants,
  getAllNearRestaurants,
  getAllPopularRestaurants,
  getRestaurantById,
  getRestaurantPicturesById,
  updateRestaurant,
  updateRestaurantBankInformation,
  deleteRestaurant,
  getNewUnapproved,
  getEstimatedTimeOfArrival,
  searchByKeyWord,
  getFavoriteRestaurantsByUserId,
  login,
  logout,
  getAdminDashboardSummary,
  getSuperAdminDashboardSummary,
  getInactiveRestaurants,
};
