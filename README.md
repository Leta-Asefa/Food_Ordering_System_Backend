# 🍽️ Food Ordering & Delivery Backend System

A full-featured, scalable backend system for a food ordering and delivery platform. Built with Node.js and Express, it powers essential services like order management, real-time tracking, rating and reviews, payment processing, notifications, and more.

---

## 🚀 Features

- 🔐 **Authentication & Security**
  - JWT authentication
  - Password hashing (bcrypt)
  - OTP verification via Twilio
  - Input sanitization (MongoDB, CORS)
  - `.env` environment configuration

- 📦 **Core Functionalities**
  - Order processing & delivery tracking
  - ETA calculation using HERE Maps
  - Item & restaurant management
  - Tiered promotion system (Platinum → Basic)
  - Rating system for food, restaurants, delivery people

- 💬 **Communication**
  - Real-time updates using `Socket.io`
  - Firebase push notifications
  - SMS and OTP via Twilio
  - Nodemailer (configured, but not yet active)

- 🧭 **Geolocation**
  - HERE Maps API for geocoding and reverse geocoding
  - React Native Maps for drawing locations and routes

- 💳 **Payments**
  - Chapa payment gateway integration
  - Webhooks for real-time status updates
  - Split payments to restaurants
  - Refund processing system

- 🖼️ **Media**
  - Image uploads via Cloudinary

- ⚡ **Performance**
  - Redis caching
  - Modular route/controllers for scalability

---

## 🧾 Data Models

This backend includes the following Mongoose models:

- `User.js`
- `Order.js` – includes default rate-limiting handling
- `Item.js` – supports ETA route
- `ItemRating.js`
- `Restaurant.js` – with default values for safety
- `RestaurantRating.js`
- `DeliveryPersonRating.js`
- `Promotion.js` – manages 5-tier slots
- `Payment.js` – supports webhook + split payments
- `Refund.js`
- `Subscription.js` – includes admin summary endpoint

---

## 🧪 Tech Stack & Dependencies

- **Node.js**, **Express.js**, **MongoDB**
- **Mongoose**, **Redis**, **Socket.io**, **Firebase Admin SDK**
- **Chapa** for payments
- **Twilio** for SMS/OTP
- **HERE Maps API** for location/distance/time
- **Cloudinary** for image storage
- **Nodemailer** for email (future-ready)

```json
{
  "axios": "^1.7.9",
  "bcrypt": "^5.1.1",
  "chapa-nodejs": "^2.0.1",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "ejs": "^3.1.10",
  "express": "^4.21.2",
  "express-mongo-sanitize": "^2.2.0",
  "firebase-admin": "^13.2.0",
  "jsonwebtoken": "^9.0.2",
  "mongo": "^0.1.0",
  "mongoose": "^8.9.1",
  "nodemailer": "^6.9.16",
  "path": "^0.12.7",
  "redis": "^4.7.0",
  "socket.io": "^4.8.1",
  "twilio": "^5.5.2"
}



