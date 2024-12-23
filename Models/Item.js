const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    image: {
        type: String,
        required: [true, 'Image path is required']
    },
    rating: {
        type: Number,
        required: true
    },
    isFasting: {
        type: Boolean,
        required: [true, 'Fasting information is required']
    },
    calories: {
        type: Number,
        required: [true, 'Calories information is required']
    },
    nutritionalInformation: {
        protein: {
            type: Number,
            required: [true, 'Protein information is required']
        },
        totalCarbohydrates: {
            type: Number,
            required: [true, 'Total carbohydrates information is required']
        },
        totalFat: {
            type: Number,
            required: [true, 'Total fat information is required']
        }
    },
    preparationTime: {
        type: String,
        required: [true, 'Preparation time is required']
    },
    allergensInformation: [
        {
            type: String,
            required: [true, 'Allergen information is required']
        }
    ]
});

// Create the Item model
const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
