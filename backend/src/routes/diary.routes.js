const express = require('express');
const router = express.Router();
const c = require('../controllers/diary.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',     c.list);
router.post('/',    c.create);
router.get('/:id',  c.get);
router.put('/:id',  c.update);
router.delete('/:id', c.remove);

module.exports = router;
