const Restaurant = require('../Models/Restaurant'); // Adjust the path to your Restaurant model

// Approve a restaurant
const approve = async (req, res) => {
    console.log('Request received!');
    const { id } = req.params; // Get the restaurant ID from the request parameters

    try {
        // Find the restaurant by ID
        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Update the isApproved property to true
        restaurant.isApproved = true;

        // Save the updated restaurant
        await restaurant.save();

        res.status(200).json(restaurant);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error approving restaurant', error });
    }
};

module.exports = {
    approve,
};
