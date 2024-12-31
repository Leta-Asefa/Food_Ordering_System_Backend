const Restaurant = require('../Models/Restaurant'); // Adjust the path to your Restaurant model
const { io } = require('../socket/socket');
const jwt = require('jsonwebtoken')

function createToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION })
}

// Create a new restaurant
const createRestaurant = async (req, res) => {
    console.log('request recieved !')
    try {
        const newRestaurant = new Restaurant(req.body);
        await newRestaurant.save();
       
        const newUnapprovedRestaurants = await Restaurant.find({isApproved:false,status:'New'});
        io.to('super_admin').emit('newapplicants',newUnapprovedRestaurants)
        

        res.status(201).json(newRestaurant);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error creating restaurant', error });
    }
};

// Get all restaurants
const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
};
// Get all new unapproved restaurants
const getNewUnapproved = async (req, res) => {
    console.log('request recieved .../getNewUnapproved ')
    try {
        const newUnapprovedRestaurants = await Restaurant.find({isApproved:false,status:'New'});
        res.status(200).json(newUnapprovedRestaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
};

// Get a single restaurant by ID
const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurant', error });
    }
};

// Update a restaurant by ID
const updateRestaurant = async (req, res) => {
    try {
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json(updatedRestaurant);
    } catch (error) {
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
        console.log('Logged in successfully',token)
        res.json({ restaurant, token })



    } catch (err) {
        console.log("error " + err)
        res.json({ 'error': err.message })
    }

}

module.exports = {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    getNewUnapproved,
    login
};
