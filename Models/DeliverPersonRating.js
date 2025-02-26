const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    deliveryPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the restaurant model
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5 // Ratings between 0 and 5
    },
    review: {
        type: String,
        required: false // Review is optional
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user model
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create the Rating model
const DeliveryPersonRating = mongoose.model('DeliveryPersonRating', ratingSchema);

module.exports = DeliveryPersonRating;
