const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const { getUsers, createUser, loginUser } = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

router.get('/', getUsers);

router.post('/signup',
    fileUpload.single('image'), [
        check('email').normalizeEmail().isEmail(),
        check('name').not().isEmpty(),
        check('password').isLength({ min: 6 })
    ], createUser);

router.post('/login', loginUser);

module.exports = router;