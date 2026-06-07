-- BountyHive Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE bounties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  type             TEXT NOT NULL CHECK (type IN ('task', 'quiz', 'creative')),
  category         TEXT NOT NULL CHECK (category IN ('Creative', 'Social', 'Analytics', 'Dev')),
  pool_amount      NUMERIC(18, 9) NOT NULL,
  pool_usd         NUMERIC(18, 2) NOT NULL DEFAULT 0,
  winner_count     INTEGER NOT NULL DEFAULT 1 CHECK (winner_count > 0),
  per_winner_amount NUMERIC(18, 9) NOT NULL,
  winner_selection TEXT NOT NULL CHECK (winner_selection IN ('draw', 'manual')),
  participants     INTEGER NOT NULL DEFAULT 0,
  deadline_at      TIMESTAMPTZ NOT NULL,
  is_hot           BOOLEAN NOT NULL DEFAULT false,
  icon             TEXT NOT NULL DEFAULT 'rocket'
                     CHECK (icon IN ('rocket', 'x', 'chart', 'code', 'star', 'trophy')),
  creator_address  TEXT NOT NULL,
  creator_name     TEXT,
  creator_avatar   TEXT,
  entry_fee        NUMERIC(18, 9),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id      UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  proof_type     TEXT NOT NULL CHECK (proof_type IN ('text', 'link', 'image')),
  content        TEXT NOT NULL,
  notes          TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('winner', 'deadline', 'submission', 'funded')),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  read           BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX bounties_status_idx      ON bounties(status);
CREATE INDEX bounties_category_idx    ON bounties(category);
CREATE INDEX bounties_creator_idx     ON bounties(creator_address);
CREATE INDEX submissions_bounty_idx   ON submissions(bounty_id);
CREATE INDEX submissions_wallet_idx   ON submissions(wallet_address);
CREATE INDEX notifications_wallet_idx ON notifications(wallet_address);
CREATE INDEX notifications_read_idx  ON notifications(wallet_address, read);

-- ─── RPC: increment_participants ─────────────────────────────────────────────
-- Called by the participate API route to avoid a race condition on the count.

CREATE OR REPLACE FUNCTION increment_participants(bounty_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bounties SET participants = participants + 1 WHERE id = bounty_id;
END;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- API routes use the service key and bypass RLS.
-- Enable RLS so direct client connections (e.g. anon key) are locked down.

ALTER TABLE bounties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Anyone can read active bounties
CREATE POLICY "bounties_public_read" ON bounties
  FOR SELECT USING (true);

-- Service role bypasses RLS automatically — no additional INSERT/UPDATE policies needed.
