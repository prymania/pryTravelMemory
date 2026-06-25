const photoModel = require('../models/photo.model');
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

// Frontend uploads directly to Supabase Storage, then POSTs metadata here
async function upload(req, res, next) {
  try {
    const {
      memory_id, original_filename, storage_key, thumbnail_key, medium_key,
      file_size, mime_type, width, height, sort_order,
      latitude, longitude, altitude, taken_at, exif_data,
    } = req.body;

    if (!storage_key) throw new AppError('storage_key required', 400);

    const photo = await photoModel.createSimple(req.user.id, {
      memory_id:         memory_id         || null,
      filename:          storage_key.split('/').pop() || storage_key,
      original_filename: original_filename  || 'photo',
      storage_key,
      thumbnail_key:     thumbnail_key      || storage_key,
      medium_key:        medium_key         || storage_key,
      file_size:         parseInt(file_size)  || 0,
      mime_type:         mime_type           || 'image/webp',
      width:             parseInt(width)     || 0,
      height:            parseInt(height)    || 0,
      sort_order:        parseInt(sort_order) || 0,
      latitude:          latitude             || null,
      longitude:         longitude            || null,
      altitude:          altitude             || null,
      taken_at:          taken_at             || null,
      exif_data:         exif_data            || null,
    });

    if (exif_data?.Make || exif_data?.Model) {
      const e = exif_data;
      await photoModel.saveExif(photo.id, {
        camera_make:      e.Make,
        camera_model:     e.Model,
        lens_model:       e.LensModel,
        focal_length:     e.FocalLength,
        focal_length_35mm:e.FocalLengthIn35mmFormat,
        aperture:         e.FNumber,
        iso:              e.ISO,
        shutter_speed:    e.ExposureTime
          ? (e.ExposureTime < 1 ? `1/${Math.round(1 / e.ExposureTime)}` : `${e.ExposureTime}s`)
          : null,
        exposure_bias:    e.ExposureCompensation,
        flash:            String(e.Flash ?? ''),
        white_balance:    String(e.WhiteBalance ?? ''),
        orientation:      e.Orientation,
        software:         e.Software,
      });
    }

    created(res, {
      ...photo,
      exif_summary: {
        has_gps: latitude != null && longitude != null,
        camera:  exif_data?.Model ? `${exif_data.Make || ''} ${exif_data.Model}`.trim() : null,
        taken_at,
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
