const { pool } = require('../config/database');

async function getAll(userId, { limit, offset, search, mood, is_favorite, visibility, trip_id, place_id } = {}) {
  let where = 'WHERE m.user_id = $1 AND m.is_deleted = FALSE';
  const params = [userId];
  let p = 1;

  if (search) {
    where += ` AND to_tsvector('simple', coalesce(m.title,'') || ' ' || coalesce(m.description,'') || ' ' || coalesce(m.note,'')) @@ plainto_tsquery('simple', $${++p})`;
    params.push(search);
  }
  if (mood)         { where += ` AND m.mood = $${++p}`;        params.push(mood); }
  if (is_favorite)  { where += ` AND m.is_favorite = $${++p}`; params.push(is_favorite === 'true'); }
  if (visibility)   { where += ` AND m.visibility = $${++p}`;  params.push(visibility); }
  if (trip_id)      { where += ` AND t.id = $${++p}`;          params.push(trip_id); }
  if (place_id)     { where += ` AND m.place_id = $${++p}`;    params.push(place_id); }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM memories m
     JOIN places pl ON pl.id = m.place_id
     JOIN trips t   ON t.id  = pl.trip_id
     ${where}`,
    params
  );

  const { rows } = await pool.query(
    `SELECT m.*, pl.name AS place_name, pl.city, pl.country, t.title AS trip_title, t.id AS trip_id,
      (SELECT storage_key FROM photos ph WHERE ph.memory_id = m.id AND ph.is_cover = TRUE AND ph.is_deleted = FALSE LIMIT 1) AS cover_photo_key,
      (SELECT COUNT(*) FROM photos ph WHERE ph.memory_id = m.id AND ph.is_deleted = FALSE) AS photo_count
    FROM memories m
    JOIN places pl ON pl.id = m.place_id
    JOIN trips t   ON t.id  = pl.trip_id
    ${where}
    ORDER BY m.memory_date DESC NULLS LAST, m.created_at DESC
    LIMIT $${++p} OFFSET $${++p}`,
    [...params, limit, offset]
  );

  return { rows, total: parseInt(countResult.rows[0].count) };
}

async function getByPlace(placeId, userId) {
  const { rows } = await pool.query(
    `SELECT m.*,
      (SELECT storage_key FROM photos ph WHERE ph.memory_id = m.id AND ph.is_cover = TRUE AND ph.is_deleted = FALSE LIMIT 1) AS cover_photo_key,
      (SELECT COUNT(*) FROM photos ph WHERE ph.memory_id = m.id AND ph.is_deleted = FALSE) AS photo_count
    FROM memories m
    WHERE m.place_id = $1 AND m.user_id = $2 AND m.is_deleted = FALSE
    ORDER BY m.memory_date ASC NULLS LAST, m.created_at ASC`,
    [placeId, userId]
  );
  return rows;
}

async function getById(id, userId) {
  const { rows } = await pool.query(
    `SELECT m.*, pl.name AS place_name, pl.city, pl.country, pl.latitude, pl.longitude,
      t.title AS trip_title, t.id AS trip_id
    FROM memories m
    JOIN places pl ON pl.id = m.place_id
    JOIN trips t   ON t.id  = pl.trip_id
    WHERE m.id = $1 AND m.user_id = $2 AND m.is_deleted = FALSE`,
    [id, userId]
  );
  return rows[0];
}

async function create(userId, data) {
  const {
    place_id, title, description, note, content_markdown,
    mood, weather, rating, is_favorite, visibility, memory_date, memory_time,
  } = data;
  const { rows } = await pool.query(
    `INSERT INTO memories
      (user_id, place_id, title, description, note, content_markdown,
       mood, weather, rating, is_favorite, visibility, memory_date, memory_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [userId, place_id, title, description, note, content_markdown,
     mood || null, weather || null, rating || null, is_favorite ?? false,
     visibility || 'private', memory_date || null, memory_time || null]
  );
  return rows[0];
}

async function update(id, userId, data) {
  const current = await getById(id, userId);
  if (!current) return null;

  // Save version snapshot
  await pool.query(
    `INSERT INTO memory_versions (memory_id, version_number, title, description, note, content_markdown, mood, weather, rating)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, current.version, current.title, current.description, current.note,
     current.content_markdown, current.mood, current.weather, current.rating]
  );

  const allowed = ['title', 'description', 'note', 'content_markdown', 'mood', 'weather',
                   'rating', 'is_favorite', 'visibility', 'memory_date', 'memory_time'];
  const fields = [];
  const params = [];
  let i = 1;

  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${i++}`); params.push(data[key]); }
  }
  if (!fields.length) return current;

  fields.push('version = version + 1', 'updated_at = NOW()');
  params.push(id, userId);

  const { rows } = await pool.query(
    `UPDATE memories SET ${fields.join(', ')}
     WHERE id = $${i++} AND user_id = $${i} AND is_deleted = FALSE RETURNING *`,
    params
  );
  return rows[0];
}

async function softDelete(id, userId) {
  const { rows } = await pool.query(
    `UPDATE memories SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function getVersions(id, userId) {
  const { rows } = await pool.query(
    `SELECT mv.* FROM memory_versions mv
     JOIN memories m ON m.id = mv.memory_id
     WHERE mv.memory_id = $1 AND m.user_id = $2
     ORDER BY mv.version_number DESC`,
    [id, userId]
  );
  return rows;
}

async function getOnThisDay(userId, month, day) {
  const { rows } = await pool.query(
    `SELECT m.*, pl.name AS place_name, pl.city, pl.country, t.title AS trip_title,
      EXTRACT(YEAR FROM m.memory_date) AS year,
      (SELECT storage_key FROM photos ph WHERE ph.memory_id = m.id AND ph.is_cover = TRUE AND ph.is_deleted = FALSE LIMIT 1) AS cover_photo_key
    FROM memories m
    JOIN places pl ON pl.id = m.place_id
    JOIN trips t   ON t.id  = pl.trip_id
    WHERE m.user_id = $1
      AND EXTRACT(MONTH FROM m.memory_date) = $2
      AND EXTRACT(DAY FROM m.memory_date)   = $3
      AND m.is_deleted = FALSE
    ORDER BY m.memory_date DESC`,
    [userId, month, day]
  );
  return rows;
}

module.exports = { getAll, getByPlace, getById, create, update, softDelete, getVersions, getOnThisDay };
