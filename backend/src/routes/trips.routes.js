const express = require('express');
const router = express.Router();
const c = require('../controllers/trips.controller');
const pc = require('../controllers/places.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',              c.list);
router.post('/',             c.create);
router.get('/:id',           c.get);
router.put('/:id',           c.update);
router.delete('/:id',        c.remove);
router.get('/:id/stats',     c.stats);
router.get('/:tripId/places', pc.listByTrip);

module.exports = router;
