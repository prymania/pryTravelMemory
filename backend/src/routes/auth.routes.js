const express = require('express');
const router = express.Router();
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/login',   c.login);
router.post('/refresh', c.refresh);
router.post('/logout',  c.logout);
router.get('/me',                authenticate, c.me);
router.put('/me',                authenticate, c.updateMe);
router.put('/profile',           authenticate, c.updateMe);
router.post('/change-password',  authenticate, c.changePassword);

module.exports = router;
