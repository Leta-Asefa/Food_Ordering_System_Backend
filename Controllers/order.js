const Order = require('../Models/Order');
const Item = require('../Models/Item');
const mongoose = require('mongoose');


// Function to create a new order
const createOrder = async (req, res) => {
    try {
        const { userId, items, shippingAddress,paymentMethod } = req.body;

        // Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            const itemDetails = await Item.findById(item.item);
            if (!itemDetails) {
                return res.status(400).json({ message: `Item with ID ${item.item} not found` });
            }
            totalAmount += itemDetails.price * item.quantity;
        }

        const newOrder = new Order({
            userId,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod
        });

        await newOrder.save();

        res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to get order by ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === 'all') {
            const orders = await Order.find().populate('items.item');
            return res.status(200).json(orders);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id).populate('items.item');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Function to get Restaurant order by ID
const getRestaurantOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.find({restaurantId:id}).populate('userId','name nationalId phoneNumber username').populate('items.item','name price');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log(order)
        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Function to get User order by ID
const getUserOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.find({userId:id}).populate('userId','name nationalId phoneNumber username').populate('items.item','name price').populate('restaurantId','name address');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log(order)
        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};





// Function to get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'name').populate('items.item', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();
        res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to delete an order
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await Order.findByIdAndDelete(id)
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createOrder, getOrderById, getAllOrders, updateOrderStatus, deleteOrder, getRestaurantOrderById,getUserOrderById };