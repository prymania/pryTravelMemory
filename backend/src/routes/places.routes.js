const express = require('express');
const router = express.Router();
const c = require('../controllers/places.controller');
const mc = require('../controllers/memories.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/nearby',           c.nearby);
router.get('/',                 c.listAll);
router.post('/',                c.create);
router.get('/:id',              c.get);
router.put('/:id',              c.update);
router.delete('/:id',           c.remove);
router.get('/:placeId/memories', mc.listByPlace);

module.exports = router;
