const express = require('express')
const mongoose = require('mongoose')
const { redisClient } = require('./redis/redis.js') //for the sake of initialization
const { chapa } = require('./Chapa/chapa.js') //for the sake of initialization
const { messaging } = require("./Firebase/firebase_config.js");//for the sake of initialization 
const cors = require('cors')
const path = require('path')
require('dotenv').config();
const cookieParser = require('cookie-parser')
const { app, server, socket_users,io } = require('./socket/socket.js');
const mongoSanitize = require('express-mongo-sanitize');
const chalk = require('chalk')

const DBURL = 'mongodb://localhost:27017/DMS' // don't forget to add the hostname,port ... to .env 
const PORT = process.env.PORT || 4000
mongoose.connect(DBURL)
const connection = mongoose.connection
connection.on('open', () => console.log(chalk.magenta.bold('✅ Database Connection Established...')))


server.listen(PORT, () => console.log(chalk.magenta.bold('✅ Server started on port ' + PORT)))

app.use('/uploads', express.static(path.join(__dirname, 'UploadedFiles')));
app.use(mongoSanitize());
app.use(express.json({ limit: '500mb' }));
app.use(cookieParser())
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
  credentials: true // Allow credentials (cookies) to be sent
}));



const userRouter = require('./Routes/user.js')
app.use('/user', userRouter)


const restaurantRouter = require('./Routes/restaurant.js')
app.use('/restaurant', restaurantRouter)


const itemRouter = require('./Routes/item.js')
app.use('/item', itemRouter)

const promotionRouter = require('./Routes/promotion.js')
app.use('/promotion', promotionRouter)


const restaurantRatingRouter = require('./Routes/restaurantRating.js')
app.use('/restaurant_rating', restaurantRatingRouter)

const deliveryPersonRating = require('./Routes/deliveryPersonRating.js')
app.use('/delivery_person_rating', deliveryPersonRating)


const itemRatingRouter = require('./Routes/itemRating.js')
app.use('/item_rating', itemRatingRouter)

const orderRouter = require('./Routes/order.js')
app.use('/order', orderRouter)

const paymentRouter = require('./Routes/payment.js')
app.use('/payment', paymentRouter)


const resadminRouter = require('./Routes/resadmin.js');
app.use('/resadmin', resadminRouter)

const gpsRouter = require('./Routes/gps.js');
app.use('/gps', gpsRouter)

const fcmRouter = require('./Routes/fcm.js');
app.use('/fcm', fcmRouter)


const { chapaWebhook } = require('./Controllers/payment.js')
app.use('/webhook/chapa', chapaWebhook)

const routeCoordinates = [
  { latitude: 9.0200, longitude: 38.7900 }, // Megenagna
  { latitude: 9.0196, longitude: 38.7888 },
  { latitude: 9.0192, longitude: 38.7875 },
  { latitude: 9.0188, longitude: 38.7863 },
  { latitude: 9.0183, longitude: 38.7851 },
  { latitude: 9.0178, longitude: 38.7839 },
  { latitude: 9.0173, longitude: 38.7827 },
  { latitude: 9.0168, longitude: 38.7815 },
  { latitude: 9.0163, longitude: 38.7803 },
  { latitude: 9.0158, longitude: 38.7791 },
  { latitude: 9.0153, longitude: 38.7779 },
  { latitude: 9.0148, longitude: 38.7767 },
  { latitude: 9.0143, longitude: 38.7755 },
  { latitude: 9.0138, longitude: 38.7743 },
  { latitude: 9.0133, longitude: 38.7731 },
  { latitude: 9.0128, longitude: 38.7719 },
  { latitude: 9.0123, longitude: 38.7707 },
  { latitude: 9.0118, longitude: 38.7695 },
  { latitude: 9.0113, longitude: 38.7683 },
  { latitude: 9.0108, longitude: 38.7671 },
  { latitude: 9.0103, longitude: 38.7659 },
  { latitude: 9.0098, longitude: 38.7647 },
  { latitude: 9.0093, longitude: 38.7635 },
  { latitude: 9.0088, longitude: 38.7623 },
  { latitude: 9.0083, longitude: 38.7611 },
  { latitude: 9.0078, longitude: 38.7599 },
  { latitude: 9.0073, longitude: 38.7587 },
  { latitude: 9.0068, longitude: 38.7575 },
  { latitude: 9.0063, longitude: 38.7563 },
  { latitude: 9.0058, longitude: 38.7551 },
  { latitude: 9.0053, longitude: 38.7539 },
  { latitude: 9.0048, longitude: 38.7527 },
  { latitude: 9.0043, longitude: 38.7515 },
  { latitude: 9.0038, longitude: 38.7503 },
  { latitude: 9.0033, longitude: 38.7491 },
  { latitude: 9.0028, longitude: 38.7479 },
  { latitude: 9.0023, longitude: 38.7467 },
  { latitude: 9.0018, longitude: 38.7455 },
  { latitude: 9.0013, longitude: 38.7443 },
  { latitude: 9.0008, longitude: 38.7431 },
  { latitude: 9.0003, longitude: 38.7419 },
  { latitude: 9.0000, longitude: 38.7400 }, // Meskel Square
];


let counter = 0;

const intervalId = setInterval(() => {
  // Only proceed if socket_users is not empty
  if (Object.keys(socket_users).length > 0) {
    
    
    const customerSocketId=socket_users["6780c81259630edf070577be"]?.socketId
    console.log("started", customerSocketId);

    // Ensure the customer ID exists before emitting
    if (customerSocketId) {
      io.to(customerSocketId).emit("current_location", {
        current_location: routeCoordinates[counter],
      });

      counter++;

      if (counter >= routeCoordinates.length) {
        clearInterval(intervalId);
        console.log("Tracking finished.");
      }
    } else {
      console.warn("Customer socket ID not found.");
    }
  } else {
    console.warn("No socket users connected yet.");
  }
}, 300);




const AppError = require('./GlobalErrors/AppError.js');
app.use((req, res, next) => {
  next(new AppError('Route not found', 404));
});





// Global error handler
const globalErrorHandler = require('./GlobalErrors/ErrorHandler.js');
app.use(globalErrorHandler);