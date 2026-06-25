-- =============================================
-- Travel Memory — Full Database Schema
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================
-- ENUM TYPES
-- =====================
DO $$ BEGIN
  CREATE TYPE mood_type AS ENUM (
    'amazing', 'happy', 'peaceful', 'neutral',
    'tired', 'nostalgic', 'sad', 'excited', 'romantic'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE weather_type AS ENUM (
    'sunny', 'cloudy', 'partly_cloudy', 'rainy',
    'stormy', 'snowy', 'foggy', 'windy', 'hot', 'cold'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE visibility_type AS ENUM (
    'private', 'public', 'shared_link', 'password_protected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('planned', 'ongoing', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE guest_memory_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================
-- UPDATED_AT TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  preferences   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =====================
-- TAGS
-- =====================
CREATE TABLE IF NOT EXISTS tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7) DEFAULT '#6B7280',
  icon        VARCHAR(50),
  usage_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- =====================
-- TRIPS
-- =====================
CREATE TABLE IF NOT EXISTS trips (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  content_markdown  TEXT,
  start_date        DATE,
  end_date          DATE,
  cover_photo_id    UUID,
  status            trip_status DEFAULT 'planned',
  visibility        visibility_type DEFAULT 'private',
  share_token       UUID UNIQUE DEFAULT uuid_generate_v4(),
  share_password_hash TEXT,
  sort_order        INT DEFAULT 0,
  place_count       INT DEFAULT 0,
  memory_count      INT DEFAULT 0,
  photo_count       INT DEFAULT 0,
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_trips_updated_at ON trips;
CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

CREATE TABLE IF NOT EXISTS trip_tags (
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (trip_id, tag_id)
);

-- =====================
-- PLACES
-- =====================
CREATE TABLE IF NOT EXISTS places (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id           UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  name_local        VARCHAR(255),
  name_translations JSONB DEFAULT '{}',
  country           VARCHAR(100),
  country_code      VARCHAR(3),
  province          VARCHAR(100),
  city              VARCHAR(100),
  address           TEXT,
  location          GEOGRAPHY(POINT, 4326),
  latitude          DECIMAL(10, 8),
  longitude         DECIMAL(11, 8),
  altitude          DECIMAL(10, 2),
  google_map_url    TEXT,
  google_place_id   VARCHAR(255),
  visited_at        DATE,
  visited_time      TIME,
  duration_minutes  INT,
  sort_order        INT DEFAULT 0,
  memory_count      INT DEFAULT 0,
  photo_count       INT DEFAULT 0,
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_places_updated_at ON places;
CREATE TRIGGER set_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_places_location    ON places USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_places_trip_id     ON places(trip_id);
CREATE INDEX IF NOT EXISTS idx_places_country     ON places(country_code);
CREATE INDEX IF NOT EXISTS idx_places_visited_at  ON places(visited_at);

-- =====================
-- MEMORIES
-- =====================
CREATE TABLE IF NOT EXISTS memories (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id            UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               VARCHAR(500) NOT NULL,
  description         TEXT,
  note                TEXT,
  content_markdown    TEXT,
  mood                mood_type,
  weather             weather_type,
  weather_data        JSONB,
  rating              SMALLINT CHECK (rating BETWEEN 1 AND 5),
  is_favorite         BOOLEAN DEFAULT FALSE,
  visibility          visibility_type DEFAULT 'private',
  share_token         UUID UNIQUE DEFAULT uuid_generate_v4(),
  share_password_hash TEXT,
  memory_date         DATE,
  memory_time         TIME,
  completeness_score  SMALLINT DEFAULT 0,
  version             INT DEFAULT 1,
  is_deleted          BOOLEAN DEFAULT FALSE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_memories_updated_at ON memories;
CREATE TRIGGER set_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_memories_place_id   ON memories(place_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id    ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_date       ON memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_favorite   ON memories(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_memories_fulltext   ON memories
  USING GIN(to_tsvector('simple',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(note,'')
  ));

CREATE TABLE IF NOT EXISTS memory_versions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id        UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  version_number   INT NOT NULL,
  title            VARCHAR(500),
  description      TEXT,
  note             TEXT,
  content_markdown TEXT,
  mood             mood_type,
  weather          weather_type,
  rating           SMALLINT,
  snapshot_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_tags (
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  tag_id    UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, tag_id)
);

-- =====================
-- PHOTOS
-- =====================
CREATE TABLE IF NOT EXISTS photos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id         UUID REFERENCES memories(id) ON DELETE SET NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename          VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500),
  storage_key       TEXT NOT NULL,
  thumbnail_key     TEXT,
  medium_key        TEXT,
  file_size         BIGINT,
  mime_type         VARCHAR(100),
  width             INT,
  height            INT,
  caption           TEXT,
  description       TEXT,
  is_highlight      BOOLEAN DEFAULT FALSE,
  is_favorite       BOOLEAN DEFAULT FALSE,
  is_cover          BOOLEAN DEFAULT FALSE,
  sort_order        INT DEFAULT 0,
  location          GEOGRAPHY(POINT, 4326),
  latitude          DECIMAL(10, 8),
  longitude         DECIMAL(11, 8),
  altitude          DECIMAL(10, 2),
  taken_at          TIMESTAMPTZ,
  exif_data         JSONB DEFAULT '{}',
  ai_analysis       JSONB DEFAULT '{}',
  ocr_text          TEXT,
  file_hash         VARCHAR(64),
  perceptual_hash   VARCHAR(64),
  is_deleted        BOOLEAN DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_photos_updated_at ON photos;
CREATE TRIGGER set_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_photos_location   ON photos USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_photos_memory_id  ON photos(memory_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id    ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_taken_at   ON photos(taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_favorite   ON photos(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_photos_file_hash  ON photos(file_hash);

CREATE TABLE IF NOT EXISTS photo_exif (
  photo_id          UUID PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  camera_make       VARCHAR(100),
  camera_model      VARCHAR(100),
  lens_model        VARCHAR(200),
  focal_length      DECIMAL(8, 2),
  focal_length_35mm DECIMAL(8, 2),
  aperture          DECIMAL(6, 2),
  iso               INT,
  shutter_speed     VARCHAR(20),
  exposure_bias     DECIMAL(4, 2),
  flash             VARCHAR(100),
  white_balance     VARCHAR(50),
  orientation       SMALLINT,
  resolution_x      INT,
  resolution_y      INT,
  color_space       VARCHAR(50),
  software          VARCHAR(200),
  is_golden_hour    BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  tag_id   UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, tag_id)
);

-- =====================
-- PEOPLE
-- =====================
CREATE TABLE IF NOT EXISTS people (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  nickname         VARCHAR(100),
  avatar_url       TEXT,
  description      TEXT,
  face_cluster_id  VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_people_updated_at ON people;
CREATE TRIGGER set_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS photo_people (
  photo_id  UUID REFERENCES photos(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  face_rect JSONB,
  confirmed BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (photo_id, person_id)
);

CREATE TABLE IF NOT EXISTS memory_people (
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, person_id)
);

-- =====================
-- DIARY
-- =====================
CREATE TABLE IF NOT EXISTS diary_entries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(500),
  content_markdown TEXT NOT NULL,
  entry_date       DATE NOT NULL,
  mood             mood_type,
  weather          weather_type,
  location         GEOGRAPHY(POINT, 4326),
  latitude         DECIMAL(10, 8),
  longitude        DECIMAL(11, 8),
  trip_id          UUID REFERENCES trips(id) ON DELETE SET NULL,
  is_deleted       BOOLEAN DEFAULT FALSE,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_diary_updated_at ON diary_entries;
CREATE TRIGGER set_diary_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS diary_photos (
  diary_id   UUID REFERENCES diary_entries(id) ON DELETE CASCADE,
  photo_id   UUID REFERENCES photos(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (diary_id, photo_id)
);

-- =====================
-- GUEST MEMORIES
-- =====================
CREATE TABLE IF NOT EXISTS guest_memories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  place_id    UUID REFERENCES places(id) ON DELETE SET NULL,
  memory_id   UUID REFERENCES memories(id) ON DELETE SET NULL,
  share_token VARCHAR(100) NOT NULL,
  guest_name  VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  content     TEXT NOT NULL,
  status      guest_memory_status DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MEMORY CONNECTIONS
-- =====================
CREATE TABLE IF NOT EXISTS memory_connections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id_a     UUID REFERENCES memories(id) ON DELETE CASCADE,
  memory_id_b     UUID REFERENCES memories(id) ON DELETE CASCADE,
  connection_type VARCHAR(50) DEFAULT 'related',
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(memory_id_a, memory_id_b)
);

-- =====================
-- PLAYLISTS
-- =====================
CREATE TABLE IF NOT EXISTS memory_playlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id  UUID REFERENCES memories(id) ON DELETE CASCADE,
  platform   VARCHAR(50),
  track_id   VARCHAR(255),
  track_name VARCHAR(500),
  artist     VARCHAR(255),
  url        TEXT,
  added_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- WEATHER CACHE
-- =====================
CREATE TABLE IF NOT EXISTS weather_cache (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat_rounded  DECIMAL(5, 2),
  lng_rounded  DECIMAL(5, 2),
  date         DATE,
  weather_data JSONB NOT NULL,
  fetched_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lat_rounded, lng_rounded, date)
);

-- =====================
-- DELETED ITEMS (Undo)
-- =====================
CREATE TABLE IF NOT EXISTS deleted_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  data        JSONB NOT NULL,
  deleted_by  UUID REFERENCES users(id),
  deleted_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- =====================
-- TRIPS cover photo FK (circular ref — added last)
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_trips_cover_photo'
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT fk_trips_cover_photo
      FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;
  END IF;
END $$;
