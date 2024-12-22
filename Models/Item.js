const mongoose = require('mongoose');

// Define the Review schema
const reviewSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    }
});

// Define the Item schema
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,  // Store the path to the image as a string
        required: true
    },
    isFasting: {
        type: String,
        enum: ['Yes', 'No'],
        required: true
    },
    reviews: {
        rating: {
            type: Number,
            required: true,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            required: true
        },
        comments: [reviewSchema]
    },
    calories: {
        type: Number,
        required: true
    },
    nutritionalInformation: {
        protein: {
            type: String,
            required: true
        },
        totalCarbohydrates: {
            type: String,
            required: true
        },
        totalFat: {
            type: String,
            required: true
        }
    },
    preparationTime: {
        type: String,
        required: true
    },
    allergensInformation: [
        {
            type: String,
            required: true
        }
    ]
});

// Create the Item model
const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
