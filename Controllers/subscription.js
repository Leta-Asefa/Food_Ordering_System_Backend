const { chapa } = require("../Chapa/chapa");
const Subscription = require("../Models/Subscription");

// CREATE
exports.createSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create(req.body);
    res.status(201).json(subscription);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate("restaurantId");
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id).populate(
      "restaurantId"
    );
    if (!subscription) return res.status(404).json({ error: "Not found" });
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateSubscription = async (req, res) => {
  try {
    const updated = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.deleteSubscription = async (req, res) => {
  try {
    const deleted = await Subscription.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByRestaurantId = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      restaurantId: req.params.restaurantId,
    });
    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });
    res.json(subscription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCheckoutUrl = async (req, res) => {
  const { phoneNumber, name, restaurantId } = req.body;
  const subscriptionId = req.params.subscriptionId;

  console.log(phoneNumber, name, restaurantId, subscriptionId);

  const tx_ref = await chapa.genTxRef();

  try {
    const response = await chapa.initialize({
      phone_number: "0987654321",
      first_name: name,
      amount: process.env.SUBSCRIPTION_PRICE,
      currency: "ETB",
      tx_ref: tx_ref,
      callback_url: "http://localhost:3000/",
      meta: {
        type: "subscription",
        subscriptionId,
        restaurantId,
      },
    });

    if (response.status === "success") {
      res.status(201).json({ url: response.data.checkout_url });
      return
    }
    res.json({ error: "can't get the url" });
  } catch (error) {
    console.log(error);
  }
};
