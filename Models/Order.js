const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deliveryPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', // Assuming you have a Restaurant model
        required: true,
      },
    items: [
        {
            item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Item',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    eta: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Ready For Pickup','Picked Up','OnTransit','Delivered','Cancelled'],
        default: 'Pending'
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'PayPal', 'Cash on Delivery'],
    },
    shippingAddress: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            default:'-'
        },
        postalCode: {
            type: String,
            default:'-'
        },
        country: {
            type: String,
            default:'-'
        },
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Middleware to update the updatedAt field
orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
