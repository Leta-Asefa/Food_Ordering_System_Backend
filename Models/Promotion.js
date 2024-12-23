const mongoose = require('mongoose');

// Define the Promotion schema
const promotionSchema = new mongoose.Schema({
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
    },
    priority: {
        type: Number,
        required: true,
        default: 1  // Default priority is 1 (highest priority)
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    durationInDays: {
        type: Number,
        required: true,
        default: 7  // Default duration is 7 days
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Middleware to automatically deactivate expired promotions
promotionSchema.pre('save', function (next) {
    const now = new Date();
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + this.durationInDays);
    this.isActive = now <= endDate;
    next();
});

// Create the Promotion model
const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
