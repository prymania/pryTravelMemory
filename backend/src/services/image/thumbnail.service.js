const sharp = require('sharp');
const path = require('path');

async function generate(sourcePath, filename) {
  const basename = path.basename(filename, path.extname(filename));
  const dir = path.dirname(sourcePath);

  const thumbFile  = `${basename}_thumb.webp`;
  const mediumFile = `${basename}_med.webp`;

  const meta = await sharp(sourcePath).metadata();

  await Promise.all([
    sharp(sourcePath)
      .resize(400, 400, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80 })
      .toFile(path.join(dir, thumbFile)),

    sharp(sourcePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(dir, mediumFile)),
  ]);

  return {
    thumbnailKey: `photos/${thumbFile}`,
    mediumKey:    `photos/${mediumFile}`,
    width:  meta.width  || 0,
    height: meta.height || 0,
  };
}

module.exports = { generate };
