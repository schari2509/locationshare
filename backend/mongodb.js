const mongodb = require('mongodb');
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.enrbe.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

module.exports = url;