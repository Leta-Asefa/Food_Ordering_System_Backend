const { default: axios } = require('axios');
const Restaurant = require('../Models/Restaurant'); // Adjust the path to your Restaurant model
const { io } = require('../socket/socket');
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const AppError = require('../GlobalErrors/AppError');
function createToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION })
}

// Create a new restaurant
const createRestaurant = async (req, res) => {
    try {
        const newRestaurant = new Restaurant(req.body);
        await newRestaurant.save();

        const newUnapprovedRestaurants = await Restaurant.find({ isApproved: false, status: 'New' });
        io.to('super_admin').emit('newapplicants', newUnapprovedRestaurants)


        res.status(201).json({ restaurant: newRestaurant });
    } catch (err) {
        let errors = {
            name: '',
            location: '',
            opened: '',
            image: '',
            cuisine: '',
            priceRange: '',
            rating: '',
            address: '',
            contact: '',
            isApproved: '',
            licenseImage: '',
            status: '',
            password: ''
        };

        if (err.cause) {
            if (err.cause.code === 11000) {
                // Handle unique constraint errors
                const field = Object.keys(err.cause.keyValue)[0];
                errors[field] = `This ${field.charAt(0).toUpperCase() + field.slice(1)} is already registered !`;
            }
        } else if (err instanceof mongoose.Error.ValidationError) {
            // Handle Mongoose validation errors
            Object.values(err.errors).forEach(({ properties }) => {
                errors[properties.path] = properties.message;
            });
        } else {
            // Log the error and set a generic error message
            console.error('Unhandled error:---------', err);
            errors.general = 'An unknown error occurred';
        }

        console.log(errors)

        res.json({ errors });
    }
};

// Get all restaurants in 10km radius
const getAllRestaurants = async (req, res) => {
    const { userLongitude, userLatitude } = req.params
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
};

// Get all Near restaurants in 10km radius
const getAllNearRestaurants = async (req, res) => {
    const { userLongitude, userLatitude } = req.params
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
            const distance = (response.data.routes[0].sections[0].summary.length / 1000).toFixed(2) + ' km';
            const distanceValue = (response.data.routes[0].sections[0].summary.length / 1000);
            const duration = (response.data.routes[0].sections[0].summary.duration / 60).toFixed(1) + ' min';
            const durationValue = (response.data.routes[0].sections[0].summary.duration / 60).toFixed(1);

            unsorted.push({ restaurant, distance, duration, distanceValue,durationValue });
        }


        const sortedByDistance = unsorted.sort((a, b) => a.distanceValue - b.distanceValue);



        res.status(200).json(sortedByDistance);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching restaurants', error });
    }
};


const getEstimatedTimeOfArrival = async (req, res) => {
    const { userLongitude, userLatitude, restaurantId } = req.params
    try {
        const restaurant = await Restaurant.findById(restaurantId);


        const requestUrl = `https://router.hereapi.com/v8/routes?apiKey=${process.env.HERE_MAP_API_KEY}&origin=${userLatitude},${userLongitude}&destination=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}&transportMode=pedestrian&return=summary`;

        console.log(requestUrl)

        const response = await axios.get(requestUrl);
        let eta = 0
        response.data.routes[0].sections.forEach((section) => {
            eta = eta + section.summary.duration
        });


        eta = (eta / 60).toFixed(1);

        res.status(200).json({ durationValue: eta });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching restaurants', error });
    }
};



// Get all new unapproved restaurants
const getNewUnapproved = async (req, res) => {
    console.log('request recieved .../getNewUnapproved ')
    try {
        const newUnapprovedRestaurants = await Restaurant.find({ isApproved: false, status: 'New' });
        res.status(200).json(newUnapprovedRestaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
};

// Get a single restaurant by ID
const getRestaurantById = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ contact: req.params.id });
        if (!restaurant) {

            next(new AppError('Restaurant with this id is not found', 404));
        }
        res.status(200).json(restaurant);
    } catch (error) {

        next(new AppError('Internal Problem', 500));
    }
};

// Get a single restaurant by ID
const getRestaurantPicturesById = async (req, res, next) => {
    try {
        const pictures = await Restaurant.findById(req.params.id).select('pictures');
        if (!pictures) {

            next(new AppError('Restaurant with this id is not found', 404));
        }
        res.status(200).json(pictures);
    } catch (error) {
        next(new AppError('Internal Problem', 500));
    }
};

// Update a restaurant by ID
const updateRestaurant = async (req, res) => {
    try {
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true });

        console.log(updatedRestaurant)

        if (!updatedRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json(updatedRestaurant);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error updating restaurant', error });
    }
};

// Delete a restaurant by ID
const deleteRestaurant = async (req, res) => {
    try {
        const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
        if (!deletedRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting restaurant', error });
    }
};

const login = async (req, res) => {

    const { phoneNumber, password } = req.body
    try {

        const restaurant = await Restaurant.login(phoneNumber, password)
        const token = createToken(restaurant._id)


        res.cookie('jwt', token)
        res.json({ restaurant, token })



    } catch (err) {
        console.log("error " + err)
        res.json({ 'error': err.message })
    }

}

module.exports = {
    createRestaurant,
    getAllRestaurants,
    getAllNearRestaurants,
    getRestaurantById,
    getRestaurantPicturesById,
    updateRestaurant,
    deleteRestaurant,
    getNewUnapproved,
    getEstimatedTimeOfArrival,
    login
};
