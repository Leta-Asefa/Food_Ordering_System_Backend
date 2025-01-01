const express = require('express')
const { Server } = require('socket.io')
const http = require('http')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
})

io.on('connection', (socket) => {

    // console.log('A new user is connected Id : ',socket.id)
    const role = socket.handshake.query.role;

    if (role === 'super_admin') {
        socket.join('super_admin');
        console.log('user joined super admin room')
    } else if (role === 'restaurant_admin') {
        socket.join('restaurant_admin');
    } else if (role === 'delivery_person') {
        socket.join('delivery_person');
    } else {
        socket.join('customer');
    }



    socket.on('disconnect', () => { console.log('User ', socket.id, ' is disconnected') })

})




module.exports = { app, server, io }