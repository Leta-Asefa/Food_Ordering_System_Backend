const express = require('express')
const { Server } = require('socket.io')
const http = require('http')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001','http://localhost:8081'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
})

const socket_users={}

io.on('connection', (socket) => {

    // console.log('A new user is connected Id : ',socket.id)
    const role = socket.handshake.query.role;
    const userId=socket.handshake.query.userId
    socket_users[userId]={socketId:socket.id}

    if (role === 'super_admin') {
        socket.join('super_admin');
        console.log('user joined super admin room')
    } else if (role === 'restaurant_admin') {
        socket.join('restaurant_admin');
    } else if (role === 'delivery_person') {
        socket.join('delivery_person');
        console.log('user joined delivery room',socket_users)
    } else {
        socket.join('customers');
        console.log('user joined customers room',socket_users)
    }



    socket.on('disconnect', () => { 
        if (socket_users[userId]) {
            delete socket_users[userId];
        }
        console.log(`User ${userId} with socket ID ${socket.id} is disconnected. remaining socket_users`,socket_users);
    }
    )

})




module.exports = { app, server, io,socket_users }