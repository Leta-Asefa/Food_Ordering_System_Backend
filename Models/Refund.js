const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', 
        required: true,
      },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', 
        required: true,
      },
 
    amount: {
        type: Number,
        required: true
    },
    reason:{
        type:String
    },
    tx_ref:{
        type:String
    },
    location:{
        type:String
    },
    status: {
        type: String,
        enum: ['Refunded', 'Declined','Requested','Initiated'],
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
refundSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create the Refund model
const Refund = mongoose.model('Refund', refundSchema);

module.exports = Refund;
