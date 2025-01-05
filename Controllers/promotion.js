const Promotion = require('../Models/Promotion');
const Restaurant = require('../Models/Restaurant');

/**
 * Add a new promotion while ensuring no conflicts exist.
 */
exports.addPromotion = async (req, res) => {
    try {
        const { restaurantId, tier, date, image, title, description } = req.body;

        // Validate required fields
        if (!restaurantId || !tier || !date || !image || !title || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if the restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check for conflicts: No two promotions of the same tier can exist on the same date
        const conflict = await Promotion.findOne({ tier, date });

        if (conflict) {
            return res.json({ message: `The ${tier} promotion slot is already taken for this date.` });
        }

        // Create the new promotion
        const newPromotion = new Promotion({
            restaurantId,
            tier,
            date,
            image,
            title,
            description
        });

        await newPromotion.save();
        return res.status(201).json({ message: 'Promotion created successfully', promotion: newPromotion });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get all promotions that are scheduled for today or in the future.
 */
exports.getPromotions = async (req, res) => {
    try {
        // Remove time part from today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const promotions = await Promotion.find({ date: { $gte: today } })
            .populate('restaurantId', 'name');

        return res.status(200).json(promotions);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


/**
 * Get a single promotion by ID.
 */
exports.getPromotionById = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id).populate('restaurantId', 'name');
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        return res.status(200).json(promotion);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Update a promotion while ensuring no conflicts exist.
 */
exports.updatePromotion = async (req, res) => {
    try {
        const { tier, date, image, title, description } = req.body;

        // Find the promotion
        let promotion = await Promotion.findById(req.params.id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        // Check for conflicts if the tier or date is being changed
        if (tier || date) {
            const conflict = await Promotion.findOne({
                tier: tier || promotion.tier,
                date: date || promotion.date,
                _id: { $ne: req.params.id } // Exclude the current promotion from conflict check
            });

            if (conflict) {
                return res.status(409).json({ message: `The ${tier || promotion.tier} promotion slot is already taken for this date.` });
            }
        }

        // Update the promotion
        promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(200).json({ message: 'Promotion updated successfully', promotion });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Delete a promotion.
 */
exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        return res.status(200).json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
