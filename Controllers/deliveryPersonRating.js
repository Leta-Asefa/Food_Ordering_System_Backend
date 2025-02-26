const DeliveryPersonRating = require('../Models/DeliverPersonRating');
const DeliverPersonRating = require('../Models/DeliverPersonRating');
const User = require('../Models/User');

// Function to add a rating
const addRating = async (req, res) => {
    try {
        const { deliveryPersonId } = req.params;
        const { userId, rating, review } = req.body;

        // Check if the user has already rated this restaurant
        const existingRating = await DeliveryPersonRating.findOne({ deliveryPersonId: deliveryPersonId, user: userId });
        if (existingRating) {
            // If a rating already exists, update it
            existingRating.rating = rating;
            existingRating.review = review;
            await existingRating.save();
            await updateDeliveryPersonAverageRating(deliveryPersonId)
            return res.status(200).json({ message: 'Rating updated successfully', rating: existingRating });
        }

        // Otherwise, create a new rating
        const newRating = new Rating({
            restaurant: restaurantId,
            user: userId, 
            rating,
            review
        });
        await newRating.save();

        // Update the restaurant's average rating
        await updateDeliveryPersonAverageRating(restaurantId);

        return res.status(201).json({ message: 'Rating added successfully', rating: newRating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to calculate and update the restaurant's average rating
const updateDeliveryPersonAverageRating = async (deliveryPersonId) => {
    const ratings = await DeliveryPersonRating.find({ deliveryPersonId: deliveryPersonId });
    if (ratings.length === 0) return;

    const totalRating = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Update the restaurant's average rating
    await User.findByIdAndUpdate(deliveryPersonId, { rating: averageRating });
};

// Function to get all ratings for a restaurant
const getRatingsForDeliveryPerson = async (req, res) => {
    try {
        const { deliveryPersonId } = req.params;
        const ratings = await DeliveryPersonRating.find({ deliveryPersonId: deliveryPersonId }).populate('user', 'username'); // Populate user name

        return res.status(200).json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addRating, getRatingsForDeliveryPerson };
