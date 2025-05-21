const Restaurant = require('../Models/Restaurant'); // Adjust the path to your Restaurant model
const User = require('../Models/User');
const sendApprovalEmail = require('../NodeMailer/send_email');

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
      //  sendApprovalEmail('letaasefa30@gmail.com', ' Tranquil ')


        res.status(200).json(restaurant);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error approving restaurant', error });
    }
};


const approveDeliveryPerson = async (req, res) => {
    console.log('Request received!');
    const { id } = req.params; // Get the restaurant ID from the request parameters

    try {
        // Find the restaurant by ID
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'delivery person not found' });
        }

        // Update the isApproved property to true
        user.status ="Approved";

        // Save the updated restaurant
        await user.save();
      //  sendApprovalEmail('letaasefa30@gmail.com', ' Tranquil ')


        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error approving restaurant', error });
    }
};

module.exports = {
    approve,
    approveDeliveryPerson
};
