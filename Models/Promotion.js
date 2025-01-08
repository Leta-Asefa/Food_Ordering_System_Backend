const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    tier: {
        type: String,
        enum: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Basic'],
        required: true
    },
    date: { type: Date, required: true }, // Single date field
    image: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, default:'inactive' },
    paymentAmount: { type: Number },
    tx_ref: { type: String,default:'' },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, immutable: true }, // Automatically set creation date
    expiresAt: { type: Date } 
});

// Ensure no duplicate promotions for the same tier on the same date
promotionSchema.index({ tier: 1, date: 1 }, { unique: true });

promotionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
