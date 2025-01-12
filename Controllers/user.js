const express = require('express')
const User = require('../Models/User')
const jwt = require('jsonwebtoken')



function handleErrors(err) {

    let errors = { username: '', password: '', role: '' }
    if (err.code == 11000) {
        errors.username = 'This username is already registered'
        return errors
    }
    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message
        })
    }

    return errors

}

function createToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION })
}

//------/all route is for testing purpose------
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

//------/get by employer------
const getByEmployer = async (req, res) => {
    try {
        const users = await User.find({ employer: req.params.employer, isActive: true }, 'username phoneNumber image');
        if (!users)
            res.json({ error: 'Users Not Found' })
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};


const signup = async (req, res) => {
    const { username, phoneNumber, password } = req.body
    const data = { username, phoneNumber, password }

    try {
        const user = new User(data)
        const createdUser = await user.save()
        const token = createToken(createdUser._id)

        res.cookie('jwt', token)
        res.json({ username: createdUser.username, token })


    } catch (err) {
        console.log(err)

        res.json({ "error": handleErrors(err) })
    }
}

const login = async (req, res) => {
    const { username, password } = req.body
    try {

        const user = await User.login(username, password)
        const token = createToken(user._id)

        res.cookie('jwt', token)
        res.json(user)



    } catch (err) {
        console.log("error *** " + err)
        res.json({ 'error': err.message })
    }

}

const logout = (req, res) => {
    res.cookie('jwt', '')
    res.json({ 'status': "logged out successfully !" })
}

const changePassword = async (req, res) => {
    const { username, oldPassword, newPassword } = req.body

    try {

        const user = await User.login(username, oldPassword)
        user.password = newPassword
        await user.save()
        const token = createToken(user._id)
        res.cookie('jwt', token)
        res.json({ 'old': oldPassword, "new": user.password, "firstName": user.firstName })

    } catch (err) {
        console.log("error " + err)
        res.status(400).json({ err: err.message })
    }

}

module.exports = {
    getAllUsers,
    signup,
    login,
    logout,
    changePassword,
    getByEmployer

};