const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

const getUsers = async(req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (error) {
        return next(new HttpError('Could not fetch users.', 500));
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const createUser = async(req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid input.', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Could not find user.', 500))
    }

    if (existingUser) {
        return next(new HttpError('User already exists. Login instead.', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('Could not create user, please try again', 500));
    }

    const newUser = new User({
        email,
        name,
        password: hashedPassword,
        image: req.file.path,
        places: []
    });
    try {
        await newUser.save();
    } catch (error) {
        return next(new HttpError('Could not sign up. Please try again later.', 500));
    }

    let token;
    try {
        token = jwt.sign({ userId: newUser.id, email: newUser.email },
            process.env.JWT_KEY, { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Could not sign up. Please try again later.', 500));
    }

    res.status(201).json({ userId: newUser.id, email: newUser.email, token: token });
};

const loginUser = async(req, res, next) => {

    const { email, password } = req.body;
    let user;
    try {
        user = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Could not log in.', 500));
    }

    if (!user) {
        return next(new HttpError('Invalid credentials. Try again', 403));
    }

    let isValidPassword;
    try {
        isValidPassword = await bcrypt.compare(password, user.password);
    } catch (err) {
        return next(new HttpError('Could not log in, please try again', 500));
    }

    if (!isValidPassword) {
        return next(new HttpError('Invalid credentials. Try again', 403));
    }

    let token;
    try {
        token = jwt.sign({ userId: user.id, email: user.email },
            process.env.JWT_KEY, { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Could not login, please try again later.', 500));
    }

    res.json({ userId: user.id, email: user.email, token: token });
};

module.exports = {
    getUsers: getUsers,
    createUser: createUser,
    loginUser: loginUser
};