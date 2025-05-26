const Rating = require('../Models/RestaurantRating');
const Restaurant = require('../Models/Restaurant');

// Function to add a rating
const addRating = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { userId, rating, review } = req.body;

        // Check if the user has already rated this restaurant
        const existingRating = await Rating.findOne({ restaurant: restaurantId, user: userId });
        if (existingRating) {
            // If a rating already exists, update it
            existingRating.rating = rating;
            existingRating.review = review;
            await existingRating.save();
            await updateRestaurantAverageRating(restaurantId)
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
        await updateRestaurantAverageRating(restaurantId);

        return res.status(201).json({ message: 'Rating added successfully', rating: newRating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to calculate and update the restaurant's average rating
const updateRestaurantAverageRating = async (restaurantId) => {
    const ratings = await Rating.find({ restaurant: restaurantId });
    if (ratings.length === 0) return;

    const totalRating = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Update the restaurant's average rating
    await Restaurant.findByIdAndUpdate(restaurantId, { rating: averageRating });
};

// Function to get all ratings for a restaurant
const getRatingsForRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const ratings = await Rating.find({ restaurant: restaurantId }).populate('user', 'username image'); // Populate user name

        return res.status(200).json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addRating, getRatingsForRestaurant };
