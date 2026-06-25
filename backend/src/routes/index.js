const express = require('express');
const router = express.Router();

router.use('/auth',     require('./auth.routes'));
router.use('/trips',    require('./trips.routes'));
router.use('/places',   require('./places.routes'));
router.use('/memories', require('./memories.routes'));
router.use('/photos',   require('./photos.routes'));
router.use('/tags',     require('./tags.routes'));
router.use('/stats',    require('./stats.routes'));
router.use('/diary',    require('./diary.routes'));
router.use('/export',   require('./export.routes'));

module.exports = router;
