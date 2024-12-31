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
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    opened: {
        type: Boolean
    },
    image: {
        type: String
    },
    cuisine: {
        type: String
    },
    priceRange: {
        type: String
    },
    rating: {
        type: Number,
    },
    address: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    isApproved: {
        type: Boolean,
        required: true,
        default: false
    },
    licenseImage: {
        type: String,  // Store the path to the image as a string
        required: true
    },
    status: {
        type: String,
        enum: ['New', 'Deliquent', 'Terminated'],
        default: 'New'
    },
});

// Create a 2dsphere index on the location field
restaurantSchema.index({ location: '2dsphere' });

// Create the model
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
