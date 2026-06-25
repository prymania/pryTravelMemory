const { pool } = require('../config/database');
const { success } = require('../utils/response');

async function overview(req, res, next) {
  try {
    const uid = req.user.id;
    const { rows } = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM trips     WHERE user_id=$1 AND is_deleted=FALSE) AS trip_count,
        (SELECT COUNT(*)::int FROM places    WHERE user_id=$1 AND is_deleted=FALSE) AS place_count,
        (SELECT COUNT(*)::int FROM memories  WHERE user_id=$1 AND is_deleted=FALSE) AS memory_count,
        (SELECT COUNT(*)::int FROM photos    WHERE user_id=$1 AND is_deleted=FALSE) AS photo_count,
        (SELECT COUNT(DISTINCT country_code)::int FROM places WHERE user_id=$1 AND is_deleted=FALSE AND country_code IS NOT NULL) AS country_count,
        (SELECT COUNT(DISTINCT city)::int FROM places WHERE user_id=$1 AND is_deleted=FALSE AND city IS NOT NULL) AS city_count,
        (SELECT COALESCE(SUM(file_size),0)::bigint FROM photos WHERE user_id=$1 AND is_deleted=FALSE) AS total_bytes`,
      [uid]
    );
    success(res, rows[0]);
  } catch (e) { next(e); }
}

async function countries(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT country, country_code, COUNT(*)::int AS visit_count
       FROM places
       WHERE user_id=$1 AND is_deleted=FALSE AND country IS NOT NULL
       GROUP BY country, country_code
       ORDER BY visit_count DESC`,
      [req.user.id]
    );
    success(res, rows);
  } catch (e) { next(e); }
}

async function cameras(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT pe.camera_make, pe.camera_model, COUNT(*)::int AS photo_count
       FROM photo_exif pe
       JOIN photos ph ON ph.id = pe.photo_id
       WHERE ph.user_id=$1 AND ph.is_deleted=FALSE
         AND pe.camera_model IS NOT NULL
       GROUP BY pe.camera_make, pe.camera_model
       ORDER BY photo_count DESC
       LIMIT 10`,
      [req.user.id]
    );
    success(res, rows);
  } catch (e) { next(e); }
}

module.exports = { overview, countries, cameras };
