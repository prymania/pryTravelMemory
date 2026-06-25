const { pool } = require('../config/database');

async function exportData(req, res, next) {
  try {
    const userId = req.user.id;

    const [trips, places, memories, photos, tags, diary] = await Promise.all([
      pool.query(`SELECT * FROM trips   WHERE user_id=$1 AND is_deleted=FALSE ORDER BY start_date`, [userId]),
      pool.query(`SELECT * FROM places  WHERE user_id=$1 AND is_deleted=FALSE ORDER BY visited_at`, [userId]),
      pool.query(`SELECT * FROM memories WHERE user_id=$1 AND is_deleted=FALSE ORDER BY memory_date`, [userId]),
      pool.query(`SELECT id, memory_id, original_filename, storage_key, thumbnail_key, taken_at, caption, latitude, longitude, is_cover, is_favorite, file_size FROM photos WHERE user_id=$1 AND is_deleted=FALSE ORDER BY taken_at`, [userId]),
      pool.query(`SELECT * FROM tags    WHERE user_id=$1 ORDER BY name`, [userId]),
      pool.query(`SELECT * FROM diary_entries WHERE user_id=$1 AND is_deleted=FALSE ORDER BY entry_date`, [userId]),
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      version: 1,
      trips:    trips.rows,
      places:   places.rows,
      memories: memories.rows,
      photos:   photos.rows,
      tags:     tags.rows,
      diary:    diary.rows,
    };

    res.setHeader('Content-Disposition', `attachment; filename="travel-memory-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (e) { next(e); }
}

module.exports = { exportData };
