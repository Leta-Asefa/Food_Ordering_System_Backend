const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Create User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  nationalId: {
    type: String,
    minlength: 16,
    default: "placeholder (FIN 123456543)",
  },
  image: {
    type: String,
  },
  password: {
    type: String,
    minlength: 1,
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "delivery", "admin", "super_admin"],
    default: "customer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Customer-specific fields
  address: {
    type: String,
  },
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  paymentMethods: [
    {
      type: String, // e.g., 'credit card', 'paypal', etc.
    },
  ],
  favouriteRestaurants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
  ],
  commonDeliveryLocations: [
    {
      name: { type: String, required: true }, // e.g., "Home", "Office"
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String },
      city: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
  ],
  // Delivery person-specific fields
  employer: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  vehicle: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  assignedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  location: {
    type: String, // Track location in a city, coordinates can be added for more advanced tracking
  },
  status: {
    type: String, // Track location in a city, coordinates can be added for more advanced tracking
  }
});

// Hash password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
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
userSchema.statics.login = async function (username, password) {
  const user = await this.findOne({ username });

  if (user) {
    if (await bcrypt.compare(password, user.password)) {
      return user;
    }
    throw Error("password is not correct");
  }
  throw Error("username is not registered");
};

// Create the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
