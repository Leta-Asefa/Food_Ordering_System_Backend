# 🍽️ Food Ordering & Delivery Backend System

A scalable and feature-rich backend system built with Node.js and Express for a food ordering and delivery platform. It supports real-time communication, geolocation-based services, secure authentication, payment integration, promotion management, rating systems, and more.

---

## 🚀 Features

- 🔐 **Authentication & Security**
  - JWT-based authentication
  - Password hashing using bcrypt
  - Environment-based secret configuration
  - Input sanitization and CORS enabled

- 📦 **Core Functionalities**
  - Order management
  - Item and restaurant listing
  - Real-time delivery tracking using Socket.io
  - Rating system for restaurants, food items, and delivery personnel

- 💬 **Communication**
  - Firebase Cloud Messaging for push notifications
  - Twilio for SMS and OTP verification
  - Nodemailer (configured for future email support)

- 🧭 **Geolocation & Mapping**
  - HERE Maps API for geocoding, reverse geocoding, and ETA calculation
  - React Native Maps integration for client-side visualizations

- 💳 **Payments & Refunds**
  - Chapa payment gateway with real-time webhook support
  - Redirect and split payment flow support
  - Full refund management system

- 📸 **Media Storage**
  - Cloudinary integration for image uploads and optimization

- ⚡ **Performance & Optimization**
  - Redis caching for faster data retrieval

- 📈 **Promotions System**
  - Create and manage 5-tier promotion slots:
    - Platinum, Gold, Silver, Bronze, Basic
  - Promotion booking with slot conflict resolution
  - Admin-level summary and analytics

---

## 📁 Models

- `User.js`
- `Order.js`
- `Item.js`
- `ItemRating.js`
- `Restaurant.js`
- `RestaurantRating.js`
- `DeliveryPersonRating.js`
- `Promotion.js`
- `Payment.js`
- `Refund.js`
- `Subscription.js`

---

## 📦 Dependencies

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
