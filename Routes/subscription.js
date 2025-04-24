const express = require('express');
const router = express.Router();
const {createSubscription,getSubscriptionById,getSubscriptions,updateSubscription,deleteSubscription,getByRestaurantId,getCheckoutUrl}=require('../Controllers/subscription')
router.post('/', createSubscription);
router.get('/', getSubscriptions);
router.get('/getSubscriptionPrice', async (req, res) => res.json({price:process.env.SUBSCRIPTION_PRICE}));
router.get('/:id', getSubscriptionById);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);
router.get('/restaurant/:restaurantId', getByRestaurantId);
router.post('/pay/:subscriptionId', getCheckoutUrl);

module.exports = router;
