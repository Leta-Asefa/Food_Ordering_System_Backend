const ItemRating = require('../Models/ItemRating');
const Item = require('../Models/Item');

// Function to add a rating
const addRating = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId, rating, review } = req.body;

        // Check if the user has already rated this item
        const existingRating = await ItemRating.findOne({ item: itemId, user: userId });
        if (existingRating) {
            // If a rating already exists, update it
            existingRating.rating = rating;
            existingRating.review = review;
            await existingRating.save();
            await updateItemAverageRating(itemId);
            return res.status(200).json({ message: 'Rating updated successfully', rating: existingRating });
        }

        // Otherwise, create a new rating
        const newRating = new ItemRating({
            item: itemId,
            user: userId,
            rating,
            review
        });
        await newRating.save();

        // Update the item's average rating
        await updateItemAverageRating(itemId);

        return res.status(201).json({ message: 'Rating added successfully', rating: newRating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to calculate and update the item's average rating
const updateItemAverageRating = async (itemId) => {
    const ratings = await ItemRating.find({ item: itemId });
    if (ratings.length === 0) return;

    const totalRating = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Update the item's average rating
    await Item.findByIdAndUpdate(itemId, { rating: averageRating });
};

// Function to get all ratings for an item
const getRatingsForItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const ratings = await ItemRating.find({ item: itemId }).populate('user', 'username image'); // Populate user name

        return res.status(200).json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addRating, getRatingsForItem };
