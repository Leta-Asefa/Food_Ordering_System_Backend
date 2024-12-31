const mongoose = require('mongoose');
const bcrypt =require('bcrypt')
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
    password: {
        type: String,
        required: true,
        minlength: 6
    }
});

// Create a 2dsphere index on the location field
restaurantSchema.index({ location: '2dsphere' });

// Hash password before saving the user
restaurantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password with salt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password in the database
restaurantSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//for login
restaurantSchema.statics.login = async function(phoneNumber, password) {
    const restaurant = await this.findOne({ contact:phoneNumber })
    if (restaurant) {
        if ( await bcrypt.compare(password, restaurant.password)) {
            return restaurant
        }
        throw Error("password is not correct")
    }throw Error("restaurant is not registered")
}



// Create the model
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
