const mongoose = require('mongoose');

// Define the schema
const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    opened: {
        type: Boolean,
        required: true
    },
    image: {
        type: String,  // Store the path to the image as a string
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    cuisine: {
        type: String,
        required: true
    },
    priceRange: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    }
});

// Create a 2dsphere index on the location field
restaurantSchema.index({ location: '2dsphere' });

// Create the model
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
