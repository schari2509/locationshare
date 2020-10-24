const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const placesRouter = require('./routes/places-routes');
const usersRouter = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const dbUrl = require('./mongodb');

app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/places', placesRouter);
app.use('/api/users', usersRouter);

app.use((req, res, next) => {
    const error = new HttpError('Could not find route.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => { console.log(err) });
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose.connect(dbUrl, { useNewUrlParser: true }).then(() => {
    app.listen(process.env.PORT || 5000, () => {
        console.log('Server running on port 5000.');
    });
}).catch(error => {
    console.log(error);
});