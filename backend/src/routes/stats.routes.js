const express = require('express');
const router = express.Router();
const c = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/overview',   c.overview);
router.get('/countries',  c.countries);
router.get('/cameras',    c.cameras);

module.exports = router;
