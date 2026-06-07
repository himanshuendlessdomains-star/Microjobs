-- BountyHive initial schema
-- Run this in Supabase > SQL Editor, or push via `supabase db push`

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- ── users ─────────────────────────────────────────────────────────────────────
create table if not exists users (
  address       text        primary key,    -- TON user-friendly address (EQ…/UQ…)
  username      text,
  telegram_id   bigint,
  created_at    timestamptz not null default now()
);

-- ── bounties ──────────────────────────────────────────────────────────────────
create table if not exists bounties (
  id               uuid        primary key default gen_random_uuid(),
  creator_address  text        not null references users(address),
  title            text        not null,
  description      text,
  category         text        not null,
  pool_amount      numeric     not null check (pool_amount > 0),
  winner_count     int         not null default 1 check (winner_count > 0),
  winner_selection text        not null check (winner_selection in ('draw', 'manual')),
  deadline         timestamptz not null,
  status           text        not null default 'active'
                               check (status in ('active', 'ended', 'cancelled')),
  icon             text        not null,
  is_hot           boolean     not null default false,
  tx_hash          text,                   -- set once escrow contract is deployed on-chain
  created_at       timestamptz not null default now()
);

create index if not exists idx_bounties_status   on bounties (status);
create index if not exists idx_bounties_category on bounties (category);
create index if not exists idx_bounties_creator  on bounties (creator_address);

-- ── participations ────────────────────────────────────────────────────────────
create table if not exists participations (
  id            uuid        primary key default gen_random_uuid(),
  bounty_id     uuid        not null references bounties(id) on delete cascade,
  user_address  text        not null references users(address),
  proof_url     text,
  proof_notes   text,
  status        text        not null default 'submitted'
                            check (status in ('submitted', 'won', 'not_selected')),
  submitted_at  timestamptz not null default now(),
  unique (bounty_id, user_address)
);

create index if not exists idx_participations_bounty on participations (bounty_id);
create index if not exists idx_participations_user   on participations (user_address);

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id            uuid        primary key default gen_random_uuid(),
  user_address  text        not null references users(address),
  type          text        not null check (type in ('winner', 'deadline', 'submission', 'funded')),
  title         text        not null,
  body          text        not null,
  bounty_id     uuid        references bounties(id) on delete set null,
  is_read       boolean     not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_user    on notifications (user_address);
create index if not exists idx_notifications_unread  on notifications (user_address, is_read) where is_read = false;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- The backend uses the service-role key (bypasses RLS for all writes).
-- These policies protect direct client connections if you ever use the anon key.

alter table users          enable row level security;
alter table bounties       enable row level security;
alter table participations enable row level security;
alter table notifications  enable row level security;

-- Bounties are publicly readable
create policy "bounties_public_read" on bounties
  for select using (true);

-- Participations count is public (for participant count display)
create policy "participations_public_read" on participations
  for select using (true);

-- Only the owner can read their notifications
-- (enforced via app.current_user_address set by the backend on each request)
create policy "notifications_owner_read" on notifications
  for select
  using (user_address = current_setting('app.current_user_address', true));
