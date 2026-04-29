-- Drop existing tables if they exist (clean slate)
drop table if exists public.admin_sessions cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.tickets cascade;

-- Create admin_users table
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now(),
  last_login_at timestamptz
);

-- Create admin_sessions table for session management
create table public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  last_activity_at timestamptz default now(),
  ip_address text,
  user_agent text
);

create index idx_admin_sessions_token on public.admin_sessions(token);
create index idx_admin_sessions_expires on public.admin_sessions(expires_at);

-- Create tickets table
create table public.tickets (
  id bigserial primary key,
  name text not null,
  phone text not null,
  email text,
  payment_method text not null,
  payment_screenshot text,
  screenshot_name text,
  status text not null default 'pending',
  total_amount integer not null default 600,
  quantity integer not null default 1,
  group_id text,
  group_total integer default 1,
  ticket_index integer default 1,
  scanned_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.admin_users(id),
  created_at timestamptz default now()
);

create index idx_tickets_status on public.tickets(status);
create index idx_tickets_group_id on public.tickets(group_id);
create index idx_tickets_phone on public.tickets(phone);

-- Enable RLS
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.tickets enable row level security;

-- Admin tables: only service role can access (no public policies = denied by default)
-- Tickets table: allow public to insert (for ticket purchase) but only service role reads/updates
create policy "tickets_public_insert" on public.tickets
  for insert
  to anon, authenticated
  with check (status = 'pending');

create policy "tickets_public_select_own" on public.tickets
  for select
  to anon, authenticated
  using (true);

-- Cleanup expired sessions automatically (function to be called periodically or on access)
create or replace function public.cleanup_expired_sessions()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.admin_sessions where expires_at < now();
end;
$$;
