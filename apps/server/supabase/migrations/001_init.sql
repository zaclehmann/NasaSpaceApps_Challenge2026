-- AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
-- MissionVitals: everything the astronaut does, per browser session. Live readings and the seeded history are
-- simulated on the server from packages/shared/src/sim, so they are not stored.
-- Row Level Security is on for every table with no policies: only the server (service role / sb_secret_ key)
-- can read or write. The browser never talks to the database.
-- Times are real wall-clock timestamps; the server converts them to mission time (MET) using the session's
-- created_at (the session starts at MET 141d 14:33).

create table public.sessions (
  id uuid primary key,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  astronaut_id text check (astronaut_id in ('hana', 'mira', 'tomas')),
  scenario text not null default 'hr-exercise'
    check (scenario in ('normal', 'hr-exercise', 'low-spo2', 'high-bp', 'mood-falling', 'sensor-dropout', 'solar-event')),
  -- Whose data the scenario changes, and when it was chosen: the simulator tells each scenario's story from then.
  scenario_target text not null default 'hana' check (scenario_target in ('hana', 'mira', 'tomas')),
  scenario_started_at timestamptz not null default now(),
  earth_link_up boolean not null default true,
  sleep_period boolean not null default false,
  mission_setting text not null default 'mars-transit' check (mission_setting in ('mars-transit', 'station', 'lunar', 'mars-rover'))
);

create table public.entered_readings (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  astronaut_id text not null check (astronaut_id in ('hana', 'mira', 'tomas')),
  indicator text not null check (indicator in ('bp', 'temp', 'glucose', 'sleep', 'exercise', 'mood')),
  value numeric not null,
  -- Diastolic, for blood pressure.
  value2 numeric,
  -- Glucose timing.
  context text check (context in ('fasting', 'before-meal', 'after-meal')),
  -- Pulse with blood pressure; stress, tags and note with mood.
  pulse numeric,
  stress smallint check (stress between 1 and 5),
  tags text[] check (cardinality(tags) <= 10),
  note text check (char_length(note) <= 500),
  device text not null check (device in ('shirt', 'cuff', 'thermometer', 'glucometer', 'dosimeter', 'self')),
  task_id text check (char_length(task_id) <= 40),
  taken_at timestamptz not null default now()
);

create table public.symptoms (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  astronaut_id text not null check (astronaut_id in ('hana', 'mira', 'tomas')),
  body_part text not null check (char_length(body_part) <= 40),
  layer text not null check (layer in ('organs', 'muscles', 'skeleton')),
  symptom text not null check (char_length(symptom) <= 40),
  -- The app's scale: 0 (barely there) to 10 (worst imaginable).
  severity smallint not null check (severity between 0 and 10),
  affects_work boolean not null default false,
  note text check (char_length(note) <= 500),
  started_at timestamptz not null,
  logged_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.routine_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  astronaut_id text not null check (astronaut_id in ('hana', 'mira', 'tomas')),
  task_id text not null check (char_length(task_id) <= 40),
  day date not null,
  kind text not null check (kind in ('completed', 'postponed')),
  at timestamptz not null default now(),
  postponed_until timestamptz,
  check (kind <> 'postponed' or postponed_until is not null)
);

create table public.alert_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  astronaut_id text not null check (astronaut_id in ('hana', 'mira', 'tomas')),
  indicator text not null check (indicator in ('hr', 'spo2', 'temp', 'bp', 'glucose', 'sleep', 'exercise', 'mood', 'radiation')),
  severity text not null check (severity in ('caution', 'warning')),
  opened_at timestamptz not null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  unique (session_id, astronaut_id, indicator, opened_at)
);

create table public.alert_actions (
  id bigint generated always as identity primary key,
  alert_event_id bigint not null references public.alert_events (id) on delete cascade,
  kind text not null check (kind in ('remeasured', 'checked-sensor', 'contacted-cmo', 'note', 'step')),
  note text check (char_length(note) <= 500),
  at timestamptz not null default now()
);

create table public.reports (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  astronaut_id text not null check (astronaut_id in ('hana', 'mira', 'tomas')),
  urgency text not null check (urgency in ('routine', '24h', 'urgent')),
  note text check (char_length(note) <= 500),
  summary jsonb not null default '{}'::jsonb check (pg_column_size(summary) <= 10240),
  queued_at timestamptz not null default now(),
  sent_at timestamptz
);

create index entered_readings_session_astronaut on public.entered_readings (session_id, astronaut_id);
create index symptoms_session_astronaut on public.symptoms (session_id, astronaut_id);
create index routine_events_session_astronaut on public.routine_events (session_id, astronaut_id);
create index alert_events_session_astronaut on public.alert_events (session_id, astronaut_id);
create index alert_actions_alert_event on public.alert_actions (alert_event_id);
create index reports_session_astronaut on public.reports (session_id, astronaut_id);

alter table public.sessions enable row level security;
alter table public.entered_readings enable row level security;
alter table public.symptoms enable row level security;
alter table public.routine_events enable row level security;
alter table public.alert_events enable row level security;
alter table public.alert_actions enable row level security;
alter table public.reports enable row level security;
