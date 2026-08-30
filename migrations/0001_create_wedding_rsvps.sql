CREATE TABLE IF NOT EXISTS wedding_rsvps (
  id TEXT PRIMARY KEY,
  edit_token_hash TEXT NOT NULL,
  guest_name TEXT NOT NULL CHECK (length(guest_name) BETWEEN 1 AND 30),
  party_size INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 6),
  needs_accommodation INTEGER NOT NULL DEFAULT 0 CHECK (needs_accommodation IN (0, 1)),
  check_in_at TEXT,
  check_out_at TEXT,
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 20),
  message TEXT CHECK (message IS NULL OR length(message) <= 200),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (needs_accommodation = 0 OR (check_in_at IS NOT NULL AND check_out_at IS NOT NULL AND check_out_at > check_in_at))
);
CREATE INDEX IF NOT EXISTS wedding_rsvps_created_at_idx ON wedding_rsvps (created_at DESC);
