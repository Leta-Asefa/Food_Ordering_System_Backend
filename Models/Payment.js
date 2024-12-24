const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema(
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Assuming you have an Order model
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true,
      },
      restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', // Assuming you have a Restaurant model
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      paymentMethod: {
        type: String,
        enum: ['Card', 'UPI', 'Cash', 'Wallet'],
        required: true,
      },
      status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending',
      },
      transactionId: {
        type: String,
        required: false,
      },
      paymentDate: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true, // Adds createdAt and updatedAt fields
    }
  );
  

  const Payment = mongoose.model('Payment', paymentSchema);
  
  module.exports = Payment;
  