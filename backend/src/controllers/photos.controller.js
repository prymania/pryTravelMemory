const fs = require('fs').promises;
const photoModel = require('../models/photo.model');
const exifService = require('../services/exif/exif.service');
const thumbnailService = require('../services/image/thumbnail.service');
const storage = require('../services/storage/storage.service');
const { success, paginated, created } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { AppError } = require('../middleware/error');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, total } = await photoModel.getAll(req.user.id, {
      limit, offset,
      is_favorite: req.query.is_favorite,
      memory_id:   req.query.memory_id,
      trip_id:     req.query.trip_id,
    });
    paginated(res, rows, total, page, limit);
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    const photo = await photoModel.getById(req.params.id, req.user.id);
    if (!photo) throw new AppError('Photo not found', 404);
    success(res, photo);
  } catch (e) { next(e); }
}

async function upload(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded');
    const file = req.file;

    // Generate thumbnails + upload original (parallel with EXIF)
    const origBuf = await fs.readFile(file.path);
    const [thumbResult, exifData, storageKey] = await Promise.all([
      thumbnailService.generate(file.path, file.filename),
      exifService.extract(file.path),
      storage.upload(origBuf, `photos/${file.filename}`, file.mimetype),
    ]);

    // Remove temp file uploaded by multer (already stored via storage service)
    fs.unlink(file.path).catch(() => {});

    const { thumbnailKey, mediumKey, width, height } = thumbResult;

    // Parse GPS from EXIF
    const lat = exifData.latitude || exifData.GPSLatitude || null;
    const lng = exifData.longitude || exifData.GPSLongitude || null;
    const takenAt = exifData.DateTimeOriginal || exifData.CreateDate || null;

    const photo = await photoModel.createSimple(req.user.id, {
      memory_id: req.body.memory_id || null,
      filename: file.filename,
      original_filename: file.originalname,
      storage_key: storageKey,
      thumbnail_key: thumbnailKey,
      medium_key: mediumKey,
      file_size: file.size,
      mime_type: file.mimetype,
      width,
      height,
      sort_order: parseInt(req.body.sort_order) || 0,
      latitude: lat,
      longitude: lng,
      altitude: exifData.GPSAltitude || null,
      taken_at: takenAt,
      exif_data: exifData,
    });

    // Save EXIF detail table
    if (exifData.Make || exifData.Model) {
      await photoModel.saveExif(photo.id, {
        camera_make: exifData.Make,
        camera_model: exifData.Model,
        lens_model: exifData.LensModel,
        focal_length: exifData.FocalLength,
        focal_length_35mm: exifData.FocalLengthIn35mmFormat,
        aperture: exifData.FNumber,
        iso: exifData.ISO,
        shutter_speed: exifData.ExposureTime
          ? (exifData.ExposureTime < 1 ? `1/${Math.round(1 / exifData.ExposureTime)}` : `${exifData.ExposureTime}s`)
          : null,
        exposure_bias: exifData.ExposureCompensation,
        flash: String(exifData.Flash ?? ''),
        white_balance: String(exifData.WhiteBalance ?? ''),
        orientation: exifData.Orientation,
        software: exifData.Software,
      });
    }

    created(res, {
      ...photo,
      exif_summary: {
        has_gps: lat != null && lng != null,
        camera: exifData.Model ? `${exifData.Make || ''} ${exifData.Model}`.trim() : null,
        taken_at: takenAt,
      },
    });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const photo = await photoModel.update(req.params.id, req.user.id, req.body);
    if (!photo) throw new AppError('Photo not found', 404);
    success(res, photo);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const photo = await photoModel.softDelete(req.params.id, req.user.id);
    if (!photo) throw new AppError('Photo not found', 404);
    success(res, null, 'Photo deleted');
  } catch (e) { next(e); }
}

async function mapMarkers(req, res, next) {
  try {
    let bbox = null;
    if (req.query.bbox) {
      const [west, south, east, north] = req.query.bbox.split(',').map(Number);
      bbox = { west, south, east, north };
    }
    const markers = await photoModel.getMapMarkers(req.user.id, bbox);
    success(res, markers);
  } catch (e) { next(e); }
}

async function setCover(req, res, next) {
  try {
    const { memory_id } = req.body;
    if (!memory_id) throw new AppError('memory_id required', 400);
    const photo = await photoModel.setCoverForMemory(req.params.id, memory_id, req.user.id);
    if (!photo) throw new AppError('Photo not found', 404);
    success(res, photo);
  } catch (e) { next(e); }
}

module.exports = { list, get, upload, update, remove, mapMarkers, setCover };
