const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config();
const cookieParser = require('cookie-parser')
const app = express()
const DBURL = 'mongodb://localhost:27017/DMS' // don't forget to add the hostname,port ... to .env 
const PORT = process.env.PORT || 4000
// const DBURL='mongodb+srv://root:0991@cluster0.dkanjkl.mongodb.net/TourAndTravelAgency' //for remote database access
mongoose.connect(DBURL)
const connection = mongoose.connection
connection.on('open', () => console.log('Database Connection Established...'))

app.listen(PORT, () => console.log('Server started on port ' + PORT))
app.use('/uploads', express.static(path.join(__dirname, 'UploadedFiles')));

app.use(express.json({ limit: '500mb' }));
app.use(cookieParser())
const frontendOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors({
  origin: frontendOrigin,
  credentials: true // Allow credentials (cookies) to be sent
}));

const userRouter = require('./Routes/user.js')
app.use('/user', userRouter)


const restaurantRouter = require('./Routes/restaurant.js')
app.use('/restaurant', restaurantRouter)


// const itemRouter = require('./Routes/item.js')
// app.use('/item', itemRouter)

// const promotionRouter = require('./Routes/promotion.js')
// app.use('/promotion', promotionRouter)


const ratingRouter = require('./Routes/rating.js')
app.use('/rating', ratingRouter)