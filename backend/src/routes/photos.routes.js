const express = require('express');
const router = express.Router();
const c = require('../controllers/photos.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

router.get('/map-markers',          c.mapMarkers);
router.get('/',                     c.list);
router.post('/upload', upload.single('photo'), c.upload);
router.get('/:id',                  c.get);
router.put('/:id',                  c.update);
router.post('/:id/set-cover',       c.setCover);
router.delete('/:id',               c.remove);

module.exports = router;
