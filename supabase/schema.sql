-- =============================================================================
-- Loss Control Portal - Supabase schema
-- =============================================================================
-- Run this in Supabase SQL Editor (Project -> SQL Editor).
-- It creates tables, triggers, and RLS policies for:
--   - Surveyor jobs and uploads
--   - Admin Markdown report blocks + parsed table storage
--   - Vessel access keys (client view without logins)
-- =============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Profiles (role management for Supabase Auth users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'surveyor' check (role in ('surveyor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Create profile row automatically when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper function: is current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Profiles policies
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- Jobs
-- -----------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),

  job_code text not null unique,              -- YYYYMMDD-ABC
  delivery_date date not null,
  client_po text,

  vessel_name text,
  vessel_code text not null check (char_length(vessel_code) = 3),

  barge_name text,
  tankerman_name text,
  tankerman_phone text,

  q1_nothing_to_report boolean not null default false,
  q1_response text,

  q2_nothing_to_report boolean not null default false,
  q2_response text,

  notes text,

  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),

  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

-- Auto-update updated_at on update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_jobs_set_updated_at on public.jobs;
create trigger trg_jobs_set_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();

-- Jobs policies
drop policy if exists "jobs_insert_authenticated" on public.jobs;
create policy "jobs_insert_authenticated"
on public.jobs
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "jobs_select_recent_or_owner_or_admin" on public.jobs;
create policy "jobs_select_recent_or_owner_or_admin"
on public.jobs
for select
to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or created_at >= now() - interval '7 days'
);

drop policy if exists "jobs_update_recent_or_owner_or_admin" on public.jobs;
create policy "jobs_update_recent_or_owner_or_admin"
on public.jobs
for update
to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or created_at >= now() - interval '7 days'
)
with check (
  public.is_admin()
  or created_by = auth.uid()
  or created_at >= now() - interval '7 days'
);

drop policy if exists "jobs_delete_admin_only" on public.jobs;
create policy "jobs_delete_admin_only"
on public.jobs
for delete
to authenticated
using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Job files (Google Drive references)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_file_kind') then
    create type public.job_file_kind as enum ('OPENING_FIGURES', 'BOL', 'BDN', 'OTHER');
  end if;
end$$;

create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,

  kind public.job_file_kind not null,

  sequence_no integer not null,
  drive_file_id text not null,
  drive_file_name text not null,
  drive_web_view_link text,
  mime_type text,

  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),

  unique(job_id, sequence_no)
);

alter table public.job_files enable row level security;

-- Helper: can current user access a given job row?
create or replace function public.can_access_job(p_job_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = p_job_id
      and (
        public.is_admin()
        or j.created_by = auth.uid()
        or j.created_at >= now() - interval '7 days'
      )
  );
$$;

-- job_files policies
drop policy if exists "job_files_select_accessible" on public.job_files;
create policy "job_files_select_accessible"
on public.job_files
for select
to authenticated
using (public.can_access_job(job_id));

drop policy if exists "job_files_insert_accessible" on public.job_files;
create policy "job_files_insert_accessible"
on public.job_files
for insert
to authenticated
with check (public.can_access_job(job_id));

drop policy if exists "job_files_delete_admin_only" on public.job_files;
create policy "job_files_delete_admin_only"
on public.job_files
for delete
to authenticated
using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Report blocks (admin-only; clients are served via server role key)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_block_type') then
    create type public.report_block_type as enum ('heading', 'table', 'note');
  end if;
end$$;

create table if not exists public.report_blocks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,

  sort_order integer not null default 1000,

  block_type public.report_block_type not null,
  heading_level integer,
  title text,
  table_type text,

  markdown text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.report_blocks enable row level security;

drop trigger if exists trg_report_blocks_set_updated_at on public.report_blocks;
create trigger trg_report_blocks_set_updated_at
before update on public.report_blocks
for each row execute procedure public.set_updated_at();

-- Admin-only policies
drop policy if exists "report_blocks_admin_only" on public.report_blocks;
create policy "report_blocks_admin_only"
on public.report_blocks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Parsed table cache (admin-only writes; helpful for analytics)
create table if not exists public.report_table_parses (
  report_block_id uuid primary key references public.report_blocks(id) on delete cascade,
  table_type text,
  headers text[],
  rows jsonb,
  parse_error text,
  parsed_at timestamptz not null default now()
);

alter table public.report_table_parses enable row level security;

drop policy if exists "report_table_parses_admin_only" on public.report_table_parses;
create policy "report_table_parses_admin_only"
on public.report_table_parses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Vessel access keys (clients have NO logins)
-- -----------------------------------------------------------------------------
create table if not exists public.vessel_access_keys (
  vessel_code text primary key check (char_length(vessel_code) = 3),
  key_hash text not null,
  active boolean not null default true,
  rotated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.vessel_access_keys enable row level security;

-- Admin-only select/update of keys
drop policy if exists "vessel_access_keys_admin_only" on public.vessel_access_keys;
create policy "vessel_access_keys_admin_only"
on public.vessel_access_keys
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Create/rotate a vessel key and return the plain key once.
create or replace function public.create_vessel_access_key(p_vessel_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_vessel_code));
  v_key text;
  v_hash text;
begin
  if char_length(v_code) <> 3 then
    raise exception 'vessel code must be exactly 3 characters';
  end if;

  -- Generate a URL-friendly random token (~32 chars)
  v_key := translate(encode(gen_random_bytes(24), 'base64'), '/+=', '___');
  v_hash := crypt(v_key, gen_salt('bf'));

  insert into public.vessel_access_keys (vessel_code, key_hash, active, rotated_at)
  values (v_code, v_hash, true, now())
  on conflict (vessel_code)
  do update set key_hash = excluded.key_hash, active = true, rotated_at = now();

  return v_key;
end;
$$;

-- Verify a provided key. (Used by the Next.js server via service role.)
create or replace function public.verify_vessel_access_key(p_vessel_code text, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vessel_access_keys vak
    where vak.vessel_code = upper(trim(p_vessel_code))
      and vak.active = true
      and vak.key_hash = crypt(p_key, vak.key_hash)
  );
$$;

-- (Optional) Allow anon to call verify function if you ever want to verify from edge/middleware.
-- revoke all on function public.verify_vessel_access_key(text, text) from public;
-- grant execute on function public.verify_vessel_access_key(text, text) to anon;


-- -----------------------------------------------------------------------------
-- Indexes (optional but recommended)
-- -----------------------------------------------------------------------------
create index if not exists idx_jobs_vessel_code_delivery_date on public.jobs (vessel_code, delivery_date desc);
create index if not exists idx_job_files_job_id on public.job_files (job_id);
create index if not exists idx_report_blocks_job_id_sort on public.report_blocks (job_id, sort_order);

-- -----------------------------------------------------------------------------
-- Grants / privileges
-- -----------------------------------------------------------------------------
-- Supabase relies on Postgres role privileges + RLS.
-- These grants ensure the authenticated role can access tables (subject to RLS).
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.jobs,
  public.job_files,
  public.report_blocks,
  public.report_table_parses,
  public.vessel_access_keys
to authenticated, service_role;

-- Service role needs execute on the vessel key functions (our app calls them server-side).
revoke all on function public.create_vessel_access_key(text) from public;
revoke all on function public.verify_vessel_access_key(text, text) from public;
grant execute on function public.create_vessel_access_key(text) to service_role;
grant execute on function public.verify_vessel_access_key(text, text) to service_role;

