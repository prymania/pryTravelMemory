const { pool } = require('../config/database');

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, name, avatar_url, preferences, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function updateProfile(id, { name, avatar_url, preferences }) {
  const { rows } = await pool.query(
    `UPDATE users SET
      name = COALESCE($1, name),
      avatar_url = COALESCE($2, avatar_url),
      preferences = COALESCE($3::jsonb, preferences),
      updated_at = NOW()
    WHERE id = $4
    RETURNING id, email, name, avatar_url, preferences`,
    [name, avatar_url, preferences ? JSON.stringify(preferences) : null, id]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, updateProfile };
