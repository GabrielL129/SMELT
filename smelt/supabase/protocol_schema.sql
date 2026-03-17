-- ============================================================
-- SMELT Protocol — Coordinator Tables
-- Run this AFTER schema.sql (the foundry/dashboard tables)
-- ============================================================

-- ─────────────────────────────────────────────
-- PROTOCOL EPOCHS
-- ─────────────────────────────────────────────
create table if not exists protocol_epochs (
  id uuid primary key default uuid_generate_v4(),
  epoch_number integer unique not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  active boolean not null default true,
  funded boolean not null default false,
  total_credits integer not null default 0,
  reward_amount numeric not null default 0,
  steel_price_usd integer not null default 620,
  steel_multiplier numeric not null default 1.0,
  steel_band text not null default 'BASELINE',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- FOUNDRY ZONES (drill sites)
-- ─────────────────────────────────────────────
create table if not exists foundry_zones (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  region text not null,
  depth text not null check (depth in ('shallow', 'medium', 'deep')),
  active boolean not null default true,
  richness_multiplier numeric not null default 1.0,
  total_batches integer not null default 50,
  remaining_batches integer not null default 50,
  depletion_pct integer not null default 0,
  reserve_estimate_label text not null default '10-50',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- MINER PROFILES
-- ─────────────────────────────────────────────
create table if not exists miner_profiles (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  stake_tier text not null default 'none' check (stake_tier in ('none', 'scout', 'operator', 'overseer')),
  staked_amount numeric not null default 0,
  total_credits_earned integer not null default 0,
  total_lots_completed integer not null default 0,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- AUTH NONCES
-- ─────────────────────────────────────────────
create table if not exists auth_nonces (
  id uuid primary key default uuid_generate_v4(),
  miner text not null,
  nonce text not null,
  message text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- AUTH TOKENS
-- ─────────────────────────────────────────────
create table if not exists auth_tokens (
  id uuid primary key default uuid_generate_v4(),
  miner text not null,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_tokens_token_idx on auth_tokens (token);
create index if not exists auth_tokens_miner_idx on auth_tokens (miner);

-- ─────────────────────────────────────────────
-- ACTIVE DRILLS (in-flight challenges)
-- ─────────────────────────────────────────────
create table if not exists active_drills (
  id uuid primary key default uuid_generate_v4(),
  miner text not null,
  site_id uuid not null references foundry_zones(id),
  challenge_id text not null,
  epoch_id integer not null,
  nonce text not null,
  depth text not null,
  credits integer not null default 1,
  constraints jsonb,
  completed boolean not null default false,
  passed boolean,
  artifact text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists active_drills_miner_idx on active_drills (miner, completed);

-- ─────────────────────────────────────────────
-- SMELT LOTS (crude lots equivalent)
-- ─────────────────────────────────────────────
create table if not exists smelt_lots (
  id uuid primary key default uuid_generate_v4(),
  miner text not null,
  site_id uuid not null references foundry_zones(id),
  challenge_id text not null,
  epoch_id integer not null,
  depth text not null,
  credits integer not null default 1,
  solve_index integer not null,
  nonce text not null,
  artifact text not null,
  status text not null default 'smelting' check (status in ('smelting', 'ready', 'claimed')),
  available_at timestamptz not null,
  ready_at timestamptz,
  signature text,
  calldata text,
  created_at timestamptz not null default now()
);

create index if not exists smelt_lots_miner_idx on smelt_lots (miner, epoch_id);
create index if not exists smelt_lots_status_idx on smelt_lots (status, available_at);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────
create trigger foundry_zones_updated_at before update on foundry_zones
  for each row execute function update_updated_at();

create trigger miner_profiles_updated_at before update on miner_profiles
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
-- RPC FUNCTION — increment epoch credits atomically
-- ─────────────────────────────────────────────
create or replace function increment_epoch_credits(p_epoch_number integer, p_credits integer)
returns void as $$
begin
  update protocol_epochs
  set total_credits = total_credits + p_credits
  where epoch_number = p_epoch_number;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table protocol_epochs enable row level security;
alter table foundry_zones enable row level security;
alter table miner_profiles enable row level security;
alter table auth_nonces enable row level security;
alter table auth_tokens enable row level security;
alter table active_drills enable row level security;
alter table smelt_lots enable row level security;

-- Public read on epochs and zones (for landing/dashboard)
create policy "Public read epochs" on protocol_epochs for select using (true);
create policy "Public read zones" on foundry_zones for select using (true);

-- Service role bypasses RLS for coordinator (it uses service role key)
-- Miner profiles public read for leaderboard
create policy "Public read miner profiles" on miner_profiles for select using (true);

-- Smelt lots: public read for leaderboard/stats
create policy "Public read smelt lots" on smelt_lots for select using (true);

-- ─────────────────────────────────────────────
-- SEED DATA — Foundry Zones
-- ─────────────────────────────────────────────
insert into foundry_zones (name, region, depth, richness_multiplier, total_batches, remaining_batches, reserve_estimate_label) values
  ('GRID-7A SURFACE STRIP',    'SECTOR-7',    'shallow', 3.0, 80,  80,  '60-120'),
  ('ASHFIELD RECOVERY ZONE',   'ASHFIELD',    'shallow', 1.5, 60,  60,  '40-80'),
  ('NORTHERN EXTRACTION GRID', 'NORTH-GRID',  'shallow', 5.0, 40,  40,  '30-200'),
  ('EMBER COAST SURFACE',      'EMBER-COAST', 'shallow', 2.0, 100, 100, '80-150'),
  ('RIDGELINE OUTER ZONE',     'RIDGELINE',   'shallow', 4.0, 50,  50,  '40-180'),
  ('DELTA-IRON FLATS',         'DELTA',       'shallow', 1.0, 120, 120, '100-140');

-- Bootstrap epoch 1
insert into protocol_epochs (epoch_number, started_at, ends_at, active, total_credits, steel_price_usd, steel_multiplier, steel_band)
values (
  1,
  now(),
  now() + interval '24 hours',
  true,
  0,
  620,
  1.0,
  'BASELINE'
) on conflict (epoch_number) do nothing;
