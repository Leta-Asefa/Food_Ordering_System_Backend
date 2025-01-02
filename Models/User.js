const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Create User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    nationalId: {
        type: String,
        minlength: 16,
        default:'placeholder (FIN 123456543)'
    }
    ,
    image: {
        type: String
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'delivery', 'admin','super_admin'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Customer-specific fields
    address: {
        type: String
    },
    orderHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    paymentMethods: [{
        type: String // e.g., 'credit card', 'paypal', etc.
    }],

    // Delivery person-specific fields
      employer:{
        type: String
      },
    assignedOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    deliveryStatus: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed', 'on-way','delayed','cancelled'],
        default: 'pending'
    },
    location: {
        type: String // Track location in a city, coordinates can be added for more advanced tracking
    },

    // Admin-specific fields
    permissions: [{
        type: String,
        enum: ['manage_users', 'view_reports', 'manage_orders', 'manage_restaurants']
    }]
});

// Hash password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password with salt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password in the database
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//for login
userSchema.statics.login = async function(username, password) {
    const user = await this.findOne({ username })
    if (user) {
        if ( await bcrypt.compare(password, user.password)) {
            return user
        }
        throw Error("password is not correct")
    }throw Error("username is not registered")
}



// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
