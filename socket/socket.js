const express = require('express')
const { Server } = require('socket.io')
const User = require('../Models/User');
const http = require('http');
const { redisClient } = require('../redis/redis');


const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
})

const socket_users = {}
// Initialize Socket.IO connection for real-time user role management
io.on('connection', async (socket) => {
    const role = socket.handshake.query.role;
    const userId = socket.handshake.query.userId;
    socket_users[userId] = { socketId: socket.id };

    

    if (role === 'super_admin') {
        socket.join('super_admin');
    } else if (role === 'restaurant_admin') {
        socket.join('restaurant_admin');
    } else if (role === 'delivery_person') {
        socket.join('delivery_person');
        console.log("User joined delivery_person room!");

    } else if (role === 'customers') {
        socket.join('customers');
    }


    socket.on('disconnect', async () => {
        const userId = Object.keys(socket_users).find(key => socket_users[key].socketId === socket.id);
        if (!userId) return;

       await redisClient.sendCommand([
            "ZREM",
            "delivery_locations", // Key of the sorted set
            `delivery_person:${userId}` // Member to remove
        ]);

       await redisClient.sendCommand([
            "DEL",
            `delivery_person_info:${userId}` // Key of the hash
        ]);
        
       

        try {
            const user = await User.findById(userId);
            if (user && user.role === 'delivery' && user.isActive) {
                user.isActive = false;
                await user.save();
                io.to("restaurant_admin").emit("updateDeliveryPersonLists", { data: false });
            }
        } catch (error) {
            console.error("Database error:", error);
        }

        delete socket_users[userId];
    });
});





module.exports = { app, server, io, socket_users }