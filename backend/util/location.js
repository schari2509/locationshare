const axios = require('axios');
const HttpError = require('../models/http-error');

const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsByAddress(address) {
    // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
    // const data = response.data;
    // if (!data || data.status === 'ZERO_RESULTS') {
    //     const error = new HttpError('Could not find location for the specified address.', 422);
    //     throw error;
    // }
    // const coordinates = data.results[0].geometry.location;

    coordinates = {
        lat: 40.7484405,
        lng: -73.9878584
    };
    return coordinates;
}

module.exports = getCoordsByAddress;