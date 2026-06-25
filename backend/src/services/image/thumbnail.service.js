const sharp = require('sharp');
const path = require('path');
const storage = require('../storage/storage.service');

async function generate(sourcePath, filename) {
  const basename = path.basename(filename, path.extname(filename));

  const thumbPath = `photos/${basename}_thumb.webp`;
  const medPath   = `photos/${basename}_med.webp`;

  const meta = await sharp(sourcePath).metadata();

  const [thumbBuf, medBuf] = await Promise.all([
    sharp(sourcePath)
      .resize(400, 400, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80 })
      .toBuffer(),

    sharp(sourcePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer(),
  ]);

  const [thumbnailKey, mediumKey] = await Promise.all([
    storage.upload(thumbBuf, thumbPath, 'image/webp'),
    storage.upload(medBuf,   medPath,   'image/webp'),
  ]);

  return {
    thumbnailKey,
    mediumKey,
    width:  meta.width  || 0,
    height: meta.height || 0,
  };
}

module.exports = { generate };
