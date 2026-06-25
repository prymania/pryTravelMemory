const { pool } = require('../config/database');

async function getAll(userId, { limit, offset, is_favorite, memory_id, trip_id } = {}) {
  let join  = '';
  let where = 'WHERE ph.user_id = $1 AND ph.is_deleted = FALSE';
  const params = [userId];
  let p = 1;

  if (trip_id) {
    join  = 'JOIN memories m ON m.id = ph.memory_id JOIN places pl ON pl.id = m.place_id JOIN trips t ON t.id = pl.trip_id';
    where += ` AND t.id = $${++p}`;
    params.push(trip_id);
  }
  if (is_favorite !== undefined) { where += ` AND ph.is_favorite = $${++p}`; params.push(is_favorite === 'true'); }
  if (memory_id)                 { where += ` AND ph.memory_id = $${++p}`;   params.push(memory_id); }

  const countResult = await pool.query(`SELECT COUNT(*) FROM photos ph ${join} ${where}`, params);

  const { rows } = await pool.query(
    `SELECT ph.* FROM photos ph ${join} ${where}
     ORDER BY ph.taken_at DESC NULLS LAST, ph.created_at DESC
     LIMIT $${++p} OFFSET $${++p}`,
    [...params, limit, offset]
  );
  return { rows, total: parseInt(countResult.rows[0].count) };
}

async function getByMemory(memoryId, userId) {
  const { rows } = await pool.query(
    `SELECT ph.*, pe.camera_make, pe.camera_model, pe.lens_model,
      pe.focal_length, pe.aperture, pe.iso, pe.shutter_speed
    FROM photos ph
    LEFT JOIN photo_exif pe ON pe.photo_id = ph.id
    WHERE ph.memory_id = $1 AND ph.user_id = $2 AND ph.is_deleted = FALSE
    ORDER BY ph.sort_order ASC, ph.taken_at ASC NULLS LAST`,
    [memoryId, userId]
  );
  return rows;
}

async function getById(id, userId) {
  const { rows } = await pool.query(
    `SELECT ph.*, pe.camera_make, pe.camera_model, pe.lens_model,
      pe.focal_length, pe.focal_length_35mm, pe.aperture, pe.iso,
      pe.shutter_speed, pe.exposure_bias, pe.flash, pe.white_balance,
      pe.orientation, pe.software, pe.is_golden_hour
    FROM photos ph
    LEFT JOIN photo_exif pe ON pe.photo_id = ph.id
    WHERE ph.id = $1 AND ph.user_id = $2 AND ph.is_deleted = FALSE`,
    [id, userId]
  );
  return rows[0];
}

async function createSimple(userId, data) {
  const {
    memory_id, filename, original_filename, storage_key, thumbnail_key, medium_key,
    file_size, mime_type, width, height, caption, sort_order,
    latitude, longitude, altitude, taken_at, exif_data,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO photos (
      user_id, memory_id, filename, original_filename, storage_key, thumbnail_key, medium_key,
      file_size, mime_type, width, height, caption, sort_order,
      latitude, longitude, altitude, taken_at, exif_data
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *`,
    [
      userId, memory_id || null, filename, original_filename, storage_key, thumbnail_key, medium_key,
      file_size, mime_type, width, height, caption || null, sort_order || 0,
      latitude || null, longitude || null, altitude || null,
      taken_at || null,
      exif_data ? JSON.stringify(exif_data) : '{}',
    ]
  );
  const photo = rows[0];

  if (latitude != null && longitude != null) {
    await pool.query(
      `UPDATE photos SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
      [longitude, latitude, photo.id]
    );
  }
  return photo;
}

async function saveExif(photoId, exif) {
  await pool.query(
    `INSERT INTO photo_exif (
      photo_id, camera_make, camera_model, lens_model,
      focal_length, focal_length_35mm, aperture, iso, shutter_speed,
      exposure_bias, flash, white_balance, orientation,
      resolution_x, resolution_y, color_space, software
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (photo_id) DO UPDATE SET
      camera_make = EXCLUDED.camera_make, camera_model = EXCLUDED.camera_model`,
    [
      photoId, exif.camera_make, exif.camera_model, exif.lens_model,
      exif.focal_length, exif.focal_length_35mm, exif.aperture,
      exif.iso, exif.shutter_speed, exif.exposure_bias,
      exif.flash, exif.white_balance, exif.orientation,
      exif.resolution_x, exif.resolution_y, exif.color_space, exif.software,
    ]
  );
}

async function update(id, userId, data) {
  const allowed = ['caption', 'description', 'is_highlight', 'is_favorite', 'is_cover', 'sort_order', 'memory_id'];
  const fields = [];
  const params = [];
  let i = 1;

  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${i++}`); params.push(data[key]); }
  }
  if (!fields.length) return getById(id, userId);

  fields.push('updated_at = NOW()');
  params.push(id, userId);

  const { rows } = await pool.query(
    `UPDATE photos SET ${fields.join(', ')}
     WHERE id = $${i++} AND user_id = $${i} AND is_deleted = FALSE RETURNING *`,
    params
  );
  return rows[0];
}

async function softDelete(id, userId) {
  const { rows } = await pool.query(
    `UPDATE photos SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function getMapMarkers(userId, bbox) {
  let where = 'WHERE ph.user_id = $1 AND ph.is_deleted = FALSE AND ph.location IS NOT NULL';
  const params = [userId];

  if (bbox) {
    where += ` AND ph.location && ST_MakeEnvelope($2, $3, $4, $5, 4326)`;
    params.push(bbox.west, bbox.south, bbox.east, bbox.north);
  }

  const { rows } = await pool.query(
    `SELECT ph.id, ph.thumbnail_key, ph.taken_at,
      ST_Y(ph.location::geometry) AS lat,
      ST_X(ph.location::geometry) AS lng,
      m.title AS memory_title, pl.name AS place_name
    FROM photos ph
    LEFT JOIN memories m ON m.id  = ph.memory_id
    LEFT JOIN places pl  ON pl.id = m.place_id
    ${where} LIMIT 2000`,
    params
  );
  return rows;
}

async function setCoverForMemory(photoId, memoryId, userId) {
  await pool.query(
    `UPDATE photos SET is_cover = FALSE, updated_at = NOW()
     WHERE memory_id = $1 AND user_id = $2 AND is_deleted = FALSE`,
    [memoryId, userId]
  );
  const { rows } = await pool.query(
    `UPDATE photos SET is_cover = TRUE, updated_at = NOW()
     WHERE id = $1 AND memory_id = $2 AND user_id = $3 AND is_deleted = FALSE RETURNING *`,
    [photoId, memoryId, userId]
  );
  return rows[0];
}

module.exports = { getAll, getByMemory, getById, createSimple, saveExif, update, softDelete, getMapMarkers, setCoverForMemory };
