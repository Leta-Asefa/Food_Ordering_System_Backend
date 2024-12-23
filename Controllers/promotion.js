const Promotion = require('../Models/Promotion');

// Function to add a new promotion
const addPromotion = async (req, res) => {
    try {
        const { imageUrl, title, description, restaurantName, restaurantId, priority, durationInDays } = req.body;
        const newPromotion = new Promotion({
            imageUrl,
            title,
            description,
            restaurantName,
            restaurantId,
            priority,
            durationInDays
        });
        await newPromotion.save();
        res.status(201).json({ message: 'Promotion added successfully', promotion: newPromotion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to get all promotions
const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ priority: 1, startDate: -1 });
        res.status(200).json(promotions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to get a promotion by ID
const getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        res.status(200).json(promotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to update a promotion
const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, title, description, restaurantName, restaurantId, priority, durationInDays } = req.body;
        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        promotion.imageUrl = imageUrl;
        promotion.title = title;
        promotion.description = description;
        promotion.restaurantName = restaurantName;
        promotion.restaurantId = restaurantId;
        promotion.priority = priority;
        promotion.durationInDays = durationInDays;

        await promotion.save();
        res.status(200).json({ message: 'Promotion updated successfully', promotion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to delete a promotion
const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        await promotion.remove();
        res.status(200).json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addPromotion, getPromotions, getPromotionById, updatePromotion, deletePromotion };
