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
⚙️ Environment Variables
Create a .env file in the root directory and add the following:

env
Copy
Edit
PORT=4000
FRONT_END_ORIGIN=http://localhost:3000

JWT_SECRET_KEY=key123
JWT_EXPIRATION=100

CHAPA_SECRET_KEY=CHASECK_TEST-yupCbRiOJ1FcfUGReVpFioCC3YZiLYXp
CHAPA_WEBHOOK_SECRET_KEY=12345678

BOOK_EXPIRY_MINUTE=30

PLATINUM_PRICE=500
GOLD_PRICE=400
SILVER_PRICE=300
BRONZE_PRICE=200
BASIC_PRICE=100

HERE_MAP_API_KEY=vNw_RmL_TFApW6kTtIGUNItPw1CCdjoA-l0Qn_1Crtk
SUBSCRIPTION_PRICE=1500

TWILIO_ACCOUNT_SID=ACe056438a0e0630e6caf82300623d272a
TWILIO_AUTH_TOKEN=d41a1585734460d46232a9ea75fbb90c
TWILIO_PHONE_NUMBER=+18737352995
⚠️ Important: Never share your real .env values in public repositories.

🛠️ Installation & Setup
Clone the repository

bash
Copy
Edit
git clone https://github.com/your-username/food-backend.git
cd food-backend
Install dependencies

bash
Copy
Edit
npm install
Set up environment variables

bash
Copy
Edit
cp .env.example .env
# Then manually add values
Run the server

bash
Copy
Edit
npm start
📡 Real-Time Services
Firebase Push Notifications

Socket.io for live order and delivery updates

Chapa webhooks for real-time payment status

Redis for high-performance caching

📊 Promotions System
Restaurants can book promotion slots:

🥇 Platinum

🥈 Gold

🥉 Silver

🟫 Bronze

⚪ Basic

Each slot has its own pricing and visibility level

Only one restaurant per slot per day

⭐ Ratings & Reviews
📦 Food items

🍽️ Restaurants

🚴 Delivery personnel

Ratings are stored and averaged, with review texts available for analytics or display.

📤 Notifications
✉️ Email (Nodemailer is configured but not active yet)

📱 SMS & OTP using Twilio

🔔 Push via Firebase

🔁 Live updates through WebSocket (Socket.io)

🔐 Security
Password hashing (bcrypt)

OTP verification

MongoDB injection sanitization

CORS origin restriction

Environment variable usage

📜 License
This project is licensed under the MIT License.

🤝 Contribution
For now, contributions are not open. You may fork and modify your own version, or reach out via issues if you're interested in collaborating in the future.

🧠 Future Plans
Email verification

Admin dashboard UI

Automated analytics reports

Delivery assignment optimization (AI-assisted)

📫 Contact
For bugs, issues, or suggestions, please open an issue.

yaml
Copy
Edit

---

📌 **Next Step**:  
Copy this into your `README.md` file at the root of your repository.

Let me know if you want help creating `.env.example`, `LICENSE`, or Swagger documentation.








