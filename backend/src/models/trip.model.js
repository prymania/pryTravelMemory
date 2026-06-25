const { pool } = require('../config/database');

async function getAll(userId, { limit, offset, status, search }) {
  let where = 'WHERE t.user_id = $1 AND t.is_deleted = FALSE';
  const params = [userId];
  let p = 1;

  if (status) { where += ` AND t.status = $${++p}`; params.push(status); }
  if (search) { where += ` AND (t.title ILIKE $${++p} OR t.description ILIKE $${p})`; params.push(`%${search}%`); }

  const countResult = await pool.query(`SELECT COUNT(*) FROM trips t ${where}`, params);

  const { rows } = await pool.query(
    `SELECT t.*,
      p.storage_key    AS cover_photo_key,
      p.thumbnail_key  AS cover_thumbnail_key
    FROM trips t
    LEFT JOIN photos p ON p.id = t.cover_photo_id
    ${where}
    ORDER BY t.start_date DESC NULLS LAST, t.created_at DESC
    LIMIT $${++p} OFFSET $${++p}`,
    [...params, limit, offset]
  );

  return { rows, total: parseInt(countResult.rows[0].count) };
}

async function getById(id, userId) {
  const { rows } = await pool.query(
    `SELECT t.*,
      p.storage_key   AS cover_photo_key,
      p.thumbnail_key AS cover_thumbnail_key
    FROM trips t
    LEFT JOIN photos p ON p.id = t.cover_photo_id
    WHERE t.id = $1 AND t.user_id = $2 AND t.is_deleted = FALSE`,
    [id, userId]
  );
  return rows[0];
}

async function create(userId, data) {
  const { title, description, content_markdown, start_date, end_date, status, visibility } = data;
  const { rows } = await pool.query(
    `INSERT INTO trips (user_id, title, description, content_markdown, start_date, end_date, status, visibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [userId, title, description, content_markdown, start_date || null, end_date || null,
     status || 'planned', visibility || 'private']
  );
  return rows[0];
}

async function update(id, userId, data) {
  const allowed = ['title', 'description', 'content_markdown', 'start_date', 'end_date', 'status', 'visibility', 'cover_photo_id'];
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
    `UPDATE trips SET ${fields.join(', ')}
     WHERE id = $${i++} AND user_id = $${i} AND is_deleted = FALSE
     RETURNING *`,
    params
  );
  return rows[0];
}

async function softDelete(id, userId) {
  const { rows } = await pool.query(
    `UPDATE trips SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function getTags(tripId) {
  const { rows } = await pool.query(
    `SELECT t.* FROM tags t JOIN trip_tags tt ON tt.tag_id = t.id WHERE tt.trip_id = $1`,
    [tripId]
  );
  return rows;
}

async function setTags(tripId, tagIds = []) {
  await pool.query('DELETE FROM trip_tags WHERE trip_id = $1', [tripId]);
  if (tagIds.length) {
    const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(`INSERT INTO trip_tags (trip_id, tag_id) VALUES ${values}`, [tripId, ...tagIds]);
  }
}

async function getStats(tripId) {
  const { rows } = await pool.query(
    `SELECT
      COUNT(DISTINCT pl.id)           AS place_count,
      COUNT(DISTINCT m.id)            AS memory_count,
      COUNT(DISTINCT ph.id)           AS photo_count,
      COUNT(DISTINCT pl.country_code) AS country_count,
      COUNT(DISTINCT pl.city)         AS city_count
    FROM places pl
    LEFT JOIN memories m  ON m.place_id  = pl.id AND m.is_deleted  = FALSE
    LEFT JOIN photos ph   ON ph.memory_id = m.id  AND ph.is_deleted = FALSE
    WHERE pl.trip_id = $1 AND pl.is_deleted = FALSE`,
    [tripId]
  );
  return rows[0];
}

module.exports = { getAll, getById, create, update, softDelete, getTags, setTags, getStats };
