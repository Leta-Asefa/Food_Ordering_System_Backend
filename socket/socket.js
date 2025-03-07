const express = require('express')
const { Server } = require('socket.io')
const User = require('../Models/User');
const http = require('http')

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

io.on('connection', async (socket) => {

    // console.log('A new user is connected Id : ',socket.id)
    const role = socket.handshake.query.role;
    const userId = socket.handshake.query.userId
    socket_users[userId] = { socketId: socket.id }

    if (role === 'super_admin') {
        socket.join('super_admin');
    } else if (role === 'restaurant_admin') {
        socket.join('restaurant_admin');
    } else if (role === 'delivery_person') {
        socket.join('delivery_person');
        console.log("user joined delivery_person room !")
        const user = await User.findById(userId)
        if (user) user.isActive = true
        await user.save()
        console.log("user" , user)
        io.to("restaurant_admin").emit("updateDeliveryPersonLists", { data: true });
    } else if (role === 'customers') {
        socket.join('customers');
    }




    socket.on('disconnect', async () => {
        const userId = Object.keys(socket_users).find(key => socket_users[key].socketId === socket.id);

        if (!userId) {
            console.log(`Socket ${socket.id} disconnected, but no userId was found.`);
            return;
        }


        // Check if the user is a delivery_person
        const user = await User.findById(userId);
        if (user && user.role === 'delivery') {
            try {
                user.isActive = false;
                await user.save();
                io.to("restaurant_admin").emit("updateDeliveryPersonLists", { data: true });
            } catch (error) {
                console.error("Database error:", error);
            }
        } else {
            console.log(`User ${userId} is not a delivery_person, skipping update.`);
        }

        // Remove user from tracking object
        if (socket_users[userId]) {
            delete socket_users[userId];
        }

        console.log(`Remaining socket_users:`, socket_users);
    });

})




module.exports = { app, server, io, socket_users }