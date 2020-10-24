const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const fs = require('fs');

const HttpError = require('../models/http-error');
const getCoordsByAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const mongoose = require('mongoose');

const getPlaceById = async(req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(new HttpError('Something went wrong. Could not find place'), 500);
    }
    if (!place) {
        return next(new HttpError('Could not find place of entered ID.', 404));
    }
    res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUser = async(req, res, next) => {
    const userId = req.params.uid;
    let userWithPlaces;

    try {
        userWithPlaces = await User.findById(userId).populate('places'); //find({creator: userId})
    } catch (err) {
        return next(new HttpError('Could not find places by the user.', 500));
    }

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(new HttpError('Could not find places of the entered user.', 404));
    }
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid input.', 422));
    }

    const { title, description, address } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsByAddress(address);
    } catch (error) {
        return next(error);
    }

    const newPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator: req.userData.userId
    });

    let user;
    try {
        user = await User.findById(req.userData.userId);
    } catch (error) {
        return next(new HttpError('Creating place failed, please try again', 500));
    }

    if (!user) {
        return next(new HttpError('Could not find user.', 404));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await newPlace.save({ session: sess });
        user.places.push(newPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Could not create place.', 500));
    }

    res.status(201).json({ place: newPlace });
};

const updatePlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        throw new HttpError('Invalid input.', 422);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let updatedPlace;
    try {
        updatedPlace = await Place.findById(placeId);
    } catch (error) {
        return next(new HttpError('Could not update place', 500));
    }

    if (updatedPlace.creator.toString() !== req.userData.userId) {
        return next(new HttpError('You are not allowed to edit this place', 401));
    }

    updatedPlace.title = title;
    updatedPlace.description = description;
    try {
        await updatedPlace.save();
    } catch (error) {
        return next(new HttpError('Could not update place.', 500));
    }

    res.json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async(req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (error) {
        return next(new HttpError('Could not delete place', 500));
    }

    if (!place) {
        return next(new HttpError('Could not find place for the id.', 404));
    }

    if (place.creator.id !== req.userData.userId) {
        return next(new HttpError('You are not allowed to delete this place', 401));
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Could not delete place', 500));
    }

    fs.unlink(imagePath, (err) => { console.log(err) });

    res.json({ message: 'Deleted place' });
};

module.exports = {
    getPlaceById: getPlaceById,
    getPlacesByUser: getPlacesByUser,
    createPlace: createPlace,
    updatePlace: updatePlace,
    deletePlace: deletePlace
};