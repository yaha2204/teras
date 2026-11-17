-- ============================================================
-- TERAS / THALORIA — Skema Mirror untuk Supabase Cloud
-- Paste file ini ke Supabase Dashboard > SQL Editor > Run
--
-- CATATAN: TIDAK ada tabel sync_outbox dan TIDAK ada trigger outbox
-- di sini. Outbox hanya hidup di PostgreSQL lokal (sumber perubahan).
-- Supabase = target replika + fallback baca/tulis.
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_data JSONB DEFAULT '{"gender": "girl", "palette": 0, "hair": 0, "skin": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(32) UNIQUE NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  host_id INT,
  is_private BOOLEAN DEFAULT FALSE,
  passcode VARCHAR(50),
  max_players INT DEFAULT 8,
  current_scene VARCHAR(30) DEFAULT 'terrace',
  music_state JSONB DEFAULT '{"videoId": "", "action": "pause", "time": 0}'::jsonb,
  siren_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_players (
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, account_id)
);

-- View publik aman (tanpa passcode / password_hash)
CREATE OR REPLACE VIEW public_rooms AS
  SELECT id, room_code, room_name, is_private, max_players,
         current_scene, music_state, siren_mode, created_at, updated_at
  FROM rooms
  WHERE is_private = FALSE;

-- Auto update updated_at (tanpa outbox)
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_accounts ON accounts;
CREATE TRIGGER trg_touch_accounts
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_rooms ON rooms;
CREATE TRIGGER trg_touch_rooms
BEFORE UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- RLS: anon hanya boleh baca daftar room publik.
-- Semua operasi tulis WAJIB lewat service_role (Vercel functions).
-- ============================================================
ALTER TABLE accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_public_rooms ON rooms;
CREATE POLICY anon_read_public_rooms ON rooms
  FOR SELECT TO anon
  USING (is_private = FALSE);

-- accounts & room_players: TIDAK ada policy untuk anon => tertutup total.
-- service_role di Supabase otomatis bypass RLS.
