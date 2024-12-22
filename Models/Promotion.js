const mongoose = require('mongoose');

// Define the Promotion schema
const promotionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    imageUrl: {
        type: String,  // Store the path to the image as a string
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    restaurantName: {
        type: String,
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
});

// Create the Promotion model
const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
