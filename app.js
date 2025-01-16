const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config();
const cookieParser = require('cookie-parser')
const { app, server } = require('./socket/socket.js');
const mongoSanitize = require('express-mongo-sanitize');
const chalk=require('chalk')

const DBURL = 'mongodb://localhost:27017/DMS' // don't forget to add the hostname,port ... to .env 
const PORT = process.env.PORT || 4000
mongoose.connect(DBURL)
const connection = mongoose.connection
connection.on('open', () => console.log(chalk.magenta.bold('Database Connection Established...')))

server.listen(PORT, () => console.log(chalk.magenta.bold('Server started on port ' + PORT)))

app.use('/uploads', express.static(path.join(__dirname, 'UploadedFiles')));
app.use(mongoSanitize());
app.use(express.json({ limit: '500mb' }));
app.use(cookieParser())
app.use(cors({
  origin: ['http://localhost:3000','http://localhost:3001','http://localhost:8081'],
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

const itemRatingRouter = require('./Routes/itemRating.js')
app.use('/item_rating', itemRatingRouter)

const orderRouter = require('./Routes/order.js')
app.use('/order', orderRouter)

const paymentRouter = require('./Routes/payment.js')
app.use('/payment', paymentRouter)

const {activatePromotion}=require('./Controllers/promotion.js')
app.use('/webhook/chapa',activatePromotion)

const resadminRouter = require('./Routes/resadmin.js');
app.use('/resadmin', resadminRouter)

const AppError = require('./GlobalErrors/AppError.js');
app.use((req, res, next) => {
  next(new AppError('Route not found', 404));
});

// Global error handler
const globalErrorHandler = require('./GlobalErrors/ErrorHandler.js');
app.use(globalErrorHandler);