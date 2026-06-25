const { pool } = require('../config/database');

async function getAllWithGps(userId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.trip_id, p.name, p.city, p.country, p.visited_at,
      p.latitude, p.longitude, p.memory_count,
      t.title AS trip_title
    FROM places p
    JOIN trips t ON t.id = p.trip_id
    WHERE p.user_id = $1 AND p.is_deleted = FALSE
      AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    ORDER BY p.visited_at DESC NULLS LAST`,
    [userId]
  );
  return { rows };
}

async function getByTrip(tripId, userId) {
  const { rows } = await pool.query(
    `SELECT p.*,
      ST_X(p.location::geometry) AS lng_geo,
      ST_Y(p.location::geometry) AS lat_geo
    FROM places p
    WHERE p.trip_id = $1 AND p.user_id = $2 AND p.is_deleted = FALSE
    ORDER BY p.sort_order ASC, p.visited_at ASC NULLS LAST`,
    [tripId, userId]
  );
  return rows;
}

async function getById(id, userId) {
  const { rows } = await pool.query(
    `SELECT p.*,
      ST_X(p.location::geometry) AS lng_geo,
      ST_Y(p.location::geometry) AS lat_geo
    FROM places p
    WHERE p.id = $1 AND p.user_id = $2 AND p.is_deleted = FALSE`,
    [id, userId]
  );
  return rows[0];
}

async function create(userId, data) {
  const {
    trip_id, name, name_local, country, country_code, province, city, address,
    latitude, longitude, altitude, google_map_url, google_place_id,
    visited_at, visited_time, sort_order,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO places (
      user_id, trip_id, name, name_local, country, country_code, province, city, address,
      latitude, longitude, altitude, google_map_url, google_place_id,
      visited_at, visited_time, sort_order
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *`,
    [
      userId, trip_id, name, name_local, country, country_code, province, city, address,
      latitude || null, longitude || null, altitude || null,
      google_map_url, google_place_id,
      visited_at || null, visited_time || null, sort_order || 0,
    ]
  );
  const place = rows[0];

  if (latitude && longitude) {
    await pool.query(
      `UPDATE places SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
      [longitude, latitude, place.id]
    );
  }
  return place;
}

async function update(id, userId, data) {
  const allowed = [
    'name', 'name_local', 'country', 'country_code', 'province', 'city', 'address',
    'altitude', 'google_map_url', 'google_place_id', 'visited_at', 'visited_time', 'sort_order',
  ];
  const fields = [];
  const params = [];
  let i = 1;

  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${i++}`); params.push(data[key]); }
  }

  if (data.latitude != null && data.longitude != null) {
    fields.push(`latitude = $${i++}`, `longitude = $${i++}`);
    params.push(data.latitude, data.longitude);
  }

  if (!fields.length) return getById(id, userId);

  fields.push('updated_at = NOW()');
  params.push(id, userId);

  const { rows } = await pool.query(
    `UPDATE places SET ${fields.join(', ')}
     WHERE id = $${i++} AND user_id = $${i} AND is_deleted = FALSE RETURNING *`,
    params
  );
  const place = rows[0];

  if (place && data.latitude != null && data.longitude != null) {
    await pool.query(
      `UPDATE places SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
      [data.longitude, data.latitude, place.id]
    );
  }
  return place;
}

async function softDelete(id, userId) {
  const { rows } = await pool.query(
    `UPDATE places SET is_deleted = TRUE, deleted_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function getNearby(lat, lng, radiusKm, userId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT p.*,
      ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
    FROM places p
    WHERE p.user_id = $3 AND p.is_deleted = FALSE AND p.location IS NOT NULL
      AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $4 * 1000)
    ORDER BY distance_km ASC
    LIMIT $5`,
    [lat, lng, userId, radiusKm, limit]
  );
  return rows;
}

module.exports = { getAllWithGps, getByTrip, getById, create, update, softDelete, getNearby };
