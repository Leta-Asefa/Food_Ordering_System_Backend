const express = require('express')
const User = require('../Models/User')
const jwt = require('jsonwebtoken')
const router = express.Router()



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
router.get('/all', async (req, res) => {
    const users = await User.find()
    res.json(users)
})

router.post('/signup', async (req, res) => {
    const { username, password, phoneNumber,role } = req.body
    const data = { username,password,phoneNumber,role }

    try {
        const user = new User(data)
        const createdUser = await user.save()
        const token = createToken(createdUser._id)

        res.cookie('jwt', token)
        res.json({ username: createdUser.username,token })


    } catch (err) {
        console.log(err)

        res.json({ "error": handleErrors(err) })
    }
})

router.post('/login', async (req, res) => {

    const { username, password } = req.body
    try {

        const user = await User.login(username, password)
        const token = createToken(user._id)


        res.cookie('jwt', token)
        res.json({ user,token })



    } catch (err) {
        console.log("error " + err)
        res.json({ 'error': err.message })
    }

})

router.get('/logout', (req, res) => {
    res.cookie('jwt', '')
    res.json({ 'status': "logged out successfully !" })
})

router.post('/change_password', async (req, res) => {
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

})

module.exports = router