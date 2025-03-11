const express = require('express')
const User = require('../Models/User')
const jwt = require('jsonwebtoken')
const AppError = require('../GlobalErrors/AppError');
const { io, socket_users } = require('../socket/socket');



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
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        if (users.length === 0)
            next(AppError("No users found, it is empty !", 400))
        res.json(users);
    } catch (error) {
        next(error)
    }
};

//------/get by employer------
const getByEmployer = async (req, res, next) => {
    const { employer } = req.params
    try {
        if (!employer) {
            return next(new AppError('Employer ID is required', 400));
        }
        if (employer === 'us') {
            const users = await User.find({ employer: employer, isActive: true }, 'username phoneNumber image');
            if (!users || users.length === 0) {
                return next(new AppError('No active users found for this employer', 404));
            }
            res.json(users);
        }
        else {
            const users = await User.find({ employer: employer, isActive: true }, 'username phoneNumber image');
            if (!users || users.length === 0) {
                return next(new AppError('No active users found for this employer', 404));
            }
            res.json(users);
        }



    } catch (error) {
        return next(error);  // Error will be handled by the global error handler
    }
};


const signup = async (req, res, next) => {
    const { username, phoneNumber, password } = req.body;

    if (!username || !phoneNumber || !password) {
        return next(new AppError(`All these fields are required ( ${username ? "" : "username"}, ${phoneNumber ? "" : "PHone Number"} , ${password ? "" : "password"})`, 400));
    }

    try {
        const user = new User({ username, phoneNumber, password });
        const createdUser = await user.save();
        const token = createToken(createdUser._id);

        res.cookie('jwt', token, { httpOnly: true, secure: true });
        res.status(201).json({ username: createdUser.username, token });

    } catch (err) {
        return next(err);  // Error will be handled by the global error handler
    }
}

const login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return next(new AppError('Username and password are required', 400));
    }

    try {
        const user = await User.login(username, password);
        if (!user) {
            return next(new AppError('Invalid username or password', 401));
        }

        if (!user.isActive) {
            user.isActive = true
            await user.save()
            console.log("switched on ...")
        }

        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, secure: true });
        res.json({ user, token });

    } catch (err) {
        return next(err);  // Error will be handled by the global error handler
    }

}

const logout = (req, res, next) => {
    res.cookie('jwt', '')
    res.json({ 'status': "logged out successfully !" })
}

const changePassword = async (req, res, next) => {
    const { username, oldPassword, newPassword } = req.body;
    console.log("gotya !")
    console.log(username, oldPassword, newPassword)

    if (!username || !oldPassword || !newPassword) {
        return next(new AppError('Username, old password, and new password are required', 400));
    }


    try {
        const user = await User.login(username, oldPassword);
        if (!user) {
            return next(new AppError('Invalid old password', 401));
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (err) {
        return next(err);  // Error will be handled by the global error handler
    }

}


const updateUser = async (req, res, next) => {
    const { userId } = req.params; // Get user ID from URL
    const { username, phoneNumber, vehicle, image, isActive } = req.body; // Allowed fields to update
    if (!userId) {
        return next(new AppError('User ID is required', 400));
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('User not found', 404));
        }


        // Update only provided fields
        if (isActive !== undefined) user.isActive = isActive;
        if (username) user.username = username;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (vehicle) user.vehicle = vehicle;
        if (image) user.image = image;



        await user.save()



        res.json({ message: "User updated successfully", isActive: user.isActive });

    } catch (err) {
        return next(err); // Handle error globally
    }
};



module.exports = {
    getAllUsers,
    signup,
    login,
    logout,
    changePassword,
    getByEmployer,
    updateUser

};