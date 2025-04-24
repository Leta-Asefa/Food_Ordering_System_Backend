const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  amount: { type: Number, required: true,default:process.env.SUBSCRIPTION_PRICE }, // e.g., 500 ETB
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date,  },
  status: { type: String, enum: ['Not Paid', 'Paid'], default: 'Not Paid' },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
