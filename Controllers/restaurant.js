const { default: axios } = require("axios");
const Restaurant = require("../Models/Restaurant"); // Adjust the path to your Restaurant model
const Order = require("../Models/Order");
const { io } = require("../socket/socket");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const AppError = require("../GlobalErrors/AppError");
const { chapa } = require("../Chapa/chapa");
const Item = require("../Models/Item");

function createToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
}

// Create a new restaurant
const createRestaurant = async (req, res) => {
  try {
    const newRestaurant = new Restaurant(req.body);
    await newRestaurant.save();

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

    
    distanceValue=((response.data.routes[0].sections[0].summary.length)/1000 ).toFixed(2)

    res.status(200).json({ durationValue: eta,distanceValue,duration:`${eta} Min`,distance:`${distanceValue} Km`,restaurant });
  } catch (error) {
    console.log(error)
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
const updateRestaurant = async (req, res) => {
  const {
    location,
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

    await restaurant.save();

    console.log("Restaurant ", restaurant);

    res.json({ message: "Restaurant updated successfully" });
  } catch (err) {
    return next(err); // Handle error globally
  }
};

// Update a restaurant bank info
const updateRestaurantBankInformation = async (req, res) => {
  const { id } = req.params;
  const { bankName, bankAccountName, bankAccountNumber } = req.body;
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
    throw error;
  }
};

// Search Restaurants, Items ... through keyword
const searchByKeyWord = async (req, res, next) => {
    const queryText = req.params.queryText;
    const regex = new RegExp(`.*${queryText}.*`, "i"); // Case-insensitive regex
  
    console.log("Query Text", queryText);
  
    try {
      const restaurants = await Restaurant.find({
        $or: [
          { name: regex },
          { address: regex },
          { cuisine: regex },
        ],
      }).select("name image cuisine location")


      const items=await Item.find({
        $or: [
          { name: regex },
          { description: regex },
          { allergensInformation: regex },
          { type: regex },
        ],
      }).select('name image description price restaurantId')
  
      res.status(200).json({result:[...restaurants,...items]});


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

  let restaurantsIdList=req.body.restaurantsIdList
   console.log("fav list id",restaurantsIdList);
  const {userLatitude,userLongitude}=req.params

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

    res.status(200).json({restaurants:sortedByDistance});

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting restaurant", error });
  }
};

const login = async (req, res) => {
  const { phoneNumber, password } = req.body;
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
};
