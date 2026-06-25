const { pool } = require('../config/database');

async function getAll(userId, { limit, offset, search, mood } = {}) {
  let where = 'WHERE d.user_id = $1 AND d.is_deleted = FALSE';
  const params = [userId];
  let p = 1;

  if (search) {
    where += ` AND to_tsvector('simple', coalesce(d.title,'') || ' ' || coalesce(d.content_markdown,'')) @@ plainto_tsquery('simple', $${++p})`;
    params.push(search);
  }
  if (mood) { where += ` AND d.mood = $${++p}`; params.push(mood); }

  const countResult = await pool.query(`SELECT COUNT(*) FROM diary_entries d ${where}`, params);
  const { rows } = await pool.query(
    `SELECT d.*,
      (SELECT COUNT(*) FROM diary_photos dp WHERE dp.diary_entry_id = d.id) AS photo_count
     FROM diary_entries d
     ${where}
     ORDER BY d.entry_date DESC NULLS LAST, d.created_at DESC
     LIMIT $${++p} OFFSET $${++p}`,
    [...params, limit, offset]
  );
  return { rows, total: parseInt(countResult.rows[0].count) };
}

async function getById(id, userId) {
  const { rows } = await pool.query(
    `SELECT d.*,
      (SELECT json_agg(json_build_object(
        'id', ph.id, 'storage_key', ph.storage_key, 'thumbnail_key', ph.thumbnail_key,
        'caption', ph.caption, 'sort_order', dp.sort_order
      ) ORDER BY dp.sort_order)
      FROM diary_photos dp
      JOIN photos ph ON ph.id = dp.photo_id AND ph.is_deleted = FALSE
      WHERE dp.diary_entry_id = d.id
    ) AS photos
    FROM diary_entries d
    WHERE d.id = $1 AND d.user_id = $2 AND d.is_deleted = FALSE`,
    [id, userId]
  );
  return rows[0];
}

async function create(userId, data) {
  const { title, content_markdown, mood, weather, entry_date, entry_time, location_text, is_favorite, visibility } = data;
  const { rows } = await pool.query(
    `INSERT INTO diary_entries
      (user_id, title, content_markdown, mood, weather, entry_date, entry_time, location_text, is_favorite, visibility)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [userId, title, content_markdown || null, mood || null, weather || null,
     entry_date || null, entry_time || null, location_text || null,
     is_favorite ?? false, visibility || 'private']
  );
  return rows[0];
}

async function update(id, userId, data) {
  const allowed = ['title', 'content_markdown', 'mood', 'weather', 'entry_date', 'entry_time',
                   'location_text', 'is_favorite', 'visibility'];
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
    `UPDATE diary_entries SET ${fields.join(', ')}
     WHERE id = $${i++} AND user_id = $${i} AND is_deleted = FALSE RETURNING *`,
    params
  );
  return rows[0];
}

async function softDelete(id, userId) {
  const { rows } = await pool.query(
    `UPDATE diary_entries SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

module.exports = { getAll, getById, create, update, softDelete };
