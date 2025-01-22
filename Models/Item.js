const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    review:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ItemRating",
    }],

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
    },
    isFasting: {
        type: Boolean,
    },
    calories: {
        type: Number,
    },
    nutritionalInformation: {
        protein: {
            type: Number,
        },
        totalCarbohydrates: {
            type: Number,
        },
        totalFat: {
            type: Number,
        }
    },
    preparationTime: {
        type: String,
    },
    allergensInformation: [
        {
            type: String,
        }
    ]
    , type: {
        type: String,
        enum: ['Food', 'Drink', 'Catering'],
        required: true
    },
});

// Create the Item model
const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
