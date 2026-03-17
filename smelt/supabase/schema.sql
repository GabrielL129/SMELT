-- ============================================================
-- SMELT — Supabase SQL Schema
-- Paste this in your Supabase SQL editor and run it
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  display_name text,
  avatar_url text,
  role text not null default 'operator' check (role in ('operator', 'observer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- EPOCHS
-- ─────────────────────────────────────────────
create table if not exists epochs (
  id uuid primary key default uuid_generate_v4(),
  epoch_number integer unique not null,
  label text not null,
  total_scrap_processed numeric not null default 0,
  total_refined_output numeric not null default 0,
  top_foundry_id uuid,
  global_pressure numeric not null default 0 check (global_pressure >= 0 and global_pressure <= 100),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- GLOBAL EVENTS
-- ─────────────────────────────────────────────
create table if not exists global_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  event_type text not null check (event_type in ('scrap_surge', 'heat_wave', 'slag_crisis', 'refinery_boost', 'system_anomaly')),
  active boolean not null default true,
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  effect_data jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- FOUNDRIES
-- ─────────────────────────────────────────────
create table if not exists foundries (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  status text not null default 'idle' check (status in ('active', 'idle', 'overheated', 'offline', 'maintenance')),
  heat numeric not null default 0 check (heat >= 0 and heat <= 100),
  fuel numeric not null default 100 check (fuel >= 0 and fuel <= 100),
  scrap_stockpile numeric not null default 0,
  slag_accumulation numeric not null default 0,
  refined_output numeric not null default 0,
  purity_score numeric not null default 0 check (purity_score >= 0 and purity_score <= 100),
  uptime_seconds bigint not null default 0,
  furnace_mode text not null default 'standard' check (furnace_mode in ('standard', 'aggressive', 'conservation', 'purge')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- FURNACES
-- ─────────────────────────────────────────────
create table if not exists furnaces (
  id uuid primary key default uuid_generate_v4(),
  foundry_id uuid not null references foundries(id) on delete cascade,
  designation text not null,
  status text not null default 'cold' check (status in ('cold', 'warming', 'active', 'critical', 'purging', 'offline')),
  temperature numeric not null default 0,
  max_temperature numeric not null default 1600,
  efficiency numeric not null default 100 check (efficiency >= 0 and efficiency <= 100),
  total_cycles integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- AGENTS
-- ─────────────────────────────────────────────
create table if not exists agents (
  id uuid primary key default uuid_generate_v4(),
  foundry_id uuid not null references foundries(id) on delete cascade,
  name text not null,
  designation text not null,
  state text not null default 'idle' check (state in ('idle', 'scanning', 'hauling', 'smelting', 'purging', 'repairing', 'overheated', 'alert')),
  mode text not null default 'autonomous' check (mode in ('manual', 'autonomous')),
  energy_level numeric not null default 100 check (energy_level >= 0 and energy_level <= 100),
  integrity numeric not null default 100 check (integrity >= 0 and integrity <= 100),
  last_action text,
  last_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- SCRAP BATCHES
-- ─────────────────────────────────────────────
create table if not exists scrap_batches (
  id uuid primary key default uuid_generate_v4(),
  foundry_id uuid not null references foundries(id) on delete cascade,
  batch_code text not null,
  scrap_weight numeric not null default 0,
  impurity_level numeric not null default 0 check (impurity_level >= 0 and impurity_level <= 100),
  thermal_difficulty numeric not null default 1 check (thermal_difficulty >= 1 and thermal_difficulty <= 10),
  origin text,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'rejected', 'purged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- BATCH JOBS
-- ─────────────────────────────────────────────
create table if not exists batch_jobs (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references scrap_batches(id) on delete cascade,
  foundry_id uuid not null references foundries(id) on delete cascade,
  furnace_id uuid references furnaces(id) on delete set null,
  agent_id uuid references agents(id) on delete set null,
  started_at timestamptz,
  estimated_completion timestamptz,
  completed_at timestamptz,
  expected_yield numeric not null default 0,
  actual_yield numeric,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'aborted')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- EVENT LOGS
-- ─────────────────────────────────────────────
create table if not exists event_logs (
  id uuid primary key default uuid_generate_v4(),
  foundry_id uuid not null references foundries(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  event_type text not null check (event_type in ('batch_start', 'batch_complete', 'heat_alert', 'purge', 'repair', 'mode_change', 'warning', 'system', 'epoch')),
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- AGENT MESSAGES
-- ─────────────────────────────────────────────
create table if not exists agent_messages (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references agents(id) on delete cascade,
  foundry_id uuid not null references foundries(id) on delete cascade,
  message_type text not null check (message_type in ('log', 'alert', 'report', 'commentary')),
  content text not null,
  is_claude_generated boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- AGENT PLANS
-- ─────────────────────────────────────────────
create table if not exists agent_plans (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references agents(id) on delete cascade,
  foundry_id uuid not null references foundries(id) on delete cascade,
  recommended_actions jsonb not null default '[]',
  next_steps jsonb not null default '[]',
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_summary text not null,
  applied boolean not null default false,
  applied_at timestamptz,
  is_claude_generated boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger foundries_updated_at before update on foundries
  for each row execute function update_updated_at();

create trigger furnaces_updated_at before update on furnaces
  for each row execute function update_updated_at();

create trigger agents_updated_at before update on agents
  for each row execute function update_updated_at();

create trigger scrap_batches_updated_at before update on scrap_batches
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table profiles enable row level security;
alter table foundries enable row level security;
alter table agents enable row level security;
alter table furnaces enable row level security;
alter table scrap_batches enable row level security;
alter table batch_jobs enable row level security;
alter table event_logs enable row level security;
alter table agent_messages enable row level security;
alter table agent_plans enable row level security;
alter table epochs enable row level security;
alter table global_events enable row level security;

-- Public read on epochs and global_events (for landing stats)
create policy "Public can read epochs" on epochs for select using (true);
create policy "Public can read global_events" on global_events for select using (true);

-- Profiles: users manage their own
create policy "Users can read own profile" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (true);
create policy "Users can update own profile" on profiles for update using (true);

-- Foundries: owner access
create policy "Owners can read foundries" on foundries for select using (true);
create policy "Owners can insert foundries" on foundries for insert with check (true);
create policy "Owners can update foundries" on foundries for update using (true);

-- All others: service role bypasses RLS
-- For now open read policies for dev, tighten in production

create policy "Read agents" on agents for select using (true);
create policy "Read furnaces" on furnaces for select using (true);
create policy "Read scrap_batches" on scrap_batches for select using (true);
create policy "Read batch_jobs" on batch_jobs for select using (true);
create policy "Read event_logs" on event_logs for select using (true);
create policy "Read agent_messages" on agent_messages for select using (true);
create policy "Read agent_plans" on agent_plans for select using (true);

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────

-- Epoch 1
insert into epochs (epoch_number, label, total_scrap_processed, total_refined_output, global_pressure, active)
values (1, 'THE FIRST MELT', 47820, 31204, 62, true);

-- Global event
insert into global_events (title, description, event_type, active, effect_data)
values (
  'SCRAP SURGE — SECTOR 7',
  'Unprocessed scrap volumes have spiked across all active foundries. Thermal pressure rising system-wide.',
  'scrap_surge',
  true,
  '{"heat_multiplier": 1.15, "scrap_bonus": 0.2}'::jsonb
);

-- Demo profile (wallet placeholder)
insert into profiles (id, wallet_address, display_name, role)
values (
  '00000000-0000-0000-0000-000000000001',
  '0xDEMO0000000000000000000000000000000001',
  'OPERATOR-01',
  'operator'
);

-- Demo foundry
insert into foundries (id, owner_id, name, status, heat, fuel, scrap_stockpile, slag_accumulation, refined_output, purity_score, uptime_seconds, furnace_mode)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'FOUNDRY PRIME',
  'active',
  74,
  61,
  8420,
  1240,
  22180,
  87.4,
  864000,
  'standard'
);

-- Demo furnace
insert into furnaces (id, foundry_id, designation, status, temperature, max_temperature, efficiency, total_cycles)
values (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'FURNACE-A1',
  'active',
  1240,
  1600,
  91,
  482
);

-- Demo agent
insert into agents (id, foundry_id, name, designation, state, mode, energy_level, integrity, last_action, last_action_at)
values (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000010',
  'FOREMAN-7',
  'AUTONOMOUS FOREMAN CLASS IV',
  'smelting',
  'autonomous',
  88,
  94,
  'Batch SCR-0482 loaded into FURNACE-A1. Thermal ramp initiated.',
  now() - interval '4 minutes'
);

-- Demo scrap batch
insert into scrap_batches (id, foundry_id, batch_code, scrap_weight, impurity_level, thermal_difficulty, origin, status)
values (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  'SCR-0482',
  3240,
  22.4,
  6,
  'SECTOR-7 SURFACE RECOVERY',
  'processing'
);

-- Demo batch job
insert into batch_jobs (batch_id, foundry_id, furnace_id, agent_id, started_at, estimated_completion, expected_yield, status)
values (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000030',
  now() - interval '18 minutes',
  now() + interval '24 minutes',
  2520,
  'running'
);

-- Demo event logs
insert into event_logs (foundry_id, agent_id, event_type, severity, message)
values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'batch_start', 'info', 'Batch SCR-0482 intake confirmed. Weight: 3240kg. Thermal ramp initiated.'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'heat_alert', 'warning', 'Heat index at 74%. Recommend monitoring slag buildup.'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'system', 'info', 'FOREMAN-7 shifted to SMELTING state. Autonomous mode active.'),
  ('00000000-0000-0000-0000-000000000010', null, 'epoch', 'info', 'EPOCH 1 — THE FIRST MELT — currently active. Global pressure: 62%.'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'purge', 'warning', 'Slag accumulation at 1240kg. Purge threshold approaching.');

-- Demo agent messages
insert into agent_messages (agent_id, foundry_id, message_type, content, is_claude_generated)
values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', 'log', 'Batch SCR-0482 loaded. Impurity at 22.4%. Running standard thermal protocol.', false),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', 'alert', 'Heat index elevated. Suggest reducing fuel injection by 8% if heat exceeds 80%.', false),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', 'report', 'Purity holding at 87.4%. Current yield projection: 2520kg refined. On track.', false);

-- Demo agent plan
insert into agent_plans (agent_id, foundry_id, recommended_actions, next_steps, risk_level, risk_summary, is_claude_generated)
values (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000010',
  '[
    {"action": "Monitor heat index", "priority": "high", "detail": "Heat at 74%. Do not exceed 85% on current batch."},
    {"action": "Schedule slag purge", "priority": "medium", "detail": "Slag at 1240kg. Purge after current batch completes."},
    {"action": "Queue SCR-0483", "priority": "low", "detail": "Next batch ready for intake. Low impurity load."}
  ]'::jsonb,
  '[
    "Complete SCR-0482 smelting cycle (ETA 24 min)",
    "Initiate slag purge sequence",
    "Load SCR-0483 — low thermal difficulty"
  ]'::jsonb,
  'medium',
  'Heat accumulation is the primary risk vector. Slag purge overdue by ~200kg.',
  false
);
