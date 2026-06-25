const express = require('express');
const router  = express.Router();
const c       = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', c.exportData);

module.exports = router;
