require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const app = require('../backend/src/config/app');
module.exports = app;
