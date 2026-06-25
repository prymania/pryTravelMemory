const { pool } = require('../config/database');

async function getAll(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM tags WHERE user_id = $1 ORDER BY usage_count DESC, name ASC',
    [userId]
  );
  return rows;
}

async function create(userId, { name, color, icon }) {
  const { rows } = await pool.query(
    `INSERT INTO tags (user_id, name, color, icon)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color, icon = EXCLUDED.icon
     RETURNING *`,
    [userId, name.toLowerCase().trim(), color || '#6B7280', icon || null]
  );
  return rows[0];
}

async function update(id, userId, data) {
  const { rows } = await pool.query(
    `UPDATE tags SET
      name  = COALESCE($1, name),
      color = COALESCE($2, color),
      icon  = COALESCE($3, icon)
     WHERE id = $4 AND user_id = $5 RETURNING *`,
    [data.name, data.color, data.icon, id, userId]
  );
  return rows[0];
}

async function remove(id, userId) {
  await pool.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [id, userId]);
}

async function setMemoryTags(memoryId, tagIds = []) {
  await pool.query('DELETE FROM memory_tags WHERE memory_id = $1', [memoryId]);
  if (tagIds.length) {
    const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(
      `INSERT INTO memory_tags (memory_id, tag_id) VALUES ${values}`,
      [memoryId, ...tagIds]
    );
  }
}

async function getMemoryTags(memoryId) {
  const { rows } = await pool.query(
    `SELECT t.* FROM tags t JOIN memory_tags mt ON mt.tag_id = t.id WHERE mt.memory_id = $1`,
    [memoryId]
  );
  return rows;
}

module.exports = { getAll, create, update, remove, setMemoryTags, getMemoryTags };
