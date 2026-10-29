-- Run this in Supabase SQL Editor after creating your project.
-- Replace owner@example.com with your own email in the OWNER BOOTSTRAP section.
create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  item_name text not null check (char_length(item_name) between 1 and 100),
  category text not null,
  location_found text not null check (char_length(location_found) between 1 and 120),
  date_found date not null,
  description text not null default '' check (char_length(description) <= 500),
  status text not null default 'Found' check (status in ('Found','Pending','Returned')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;
alter table public.admin_users enable row level security;

-- Authenticated users can browse public-safe item listing fields.
drop policy if exists "Signed-in users can read reports" on public.reports;
create policy "Signed-in users can read reports" on public.reports for select to authenticated using (true);

drop policy if exists "Signed-in users can create own reports" on public.reports;
create policy "Signed-in users can create own reports" on public.reports for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Creators can edit own reports" on public.reports;
create policy "Creators can edit own reports" on public.reports for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- SECURITY DEFINER helper avoids recursive RLS checks on admin_users.
create or replace function public.is_yukti_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_yukti_admin() from public;
grant execute on function public.is_yukti_admin() to authenticated;

-- Users can check their own admin row; admins can inspect the allowlist.
drop policy if exists "Users can check own admin row" on public.admin_users;
create policy "Users can check own admin row" on public.admin_users
for select to authenticated using (user_id = auth.uid() or public.is_yukti_admin());

-- No client-side insert/update/delete policies exist for admin_users.

-- OWNER BOOTSTRAP:
-- 1) Sign up in YUKTI using your own email and verify it.
-- 2) Replace owner@example.com below with that exact email, then run this block manually in SQL Editor.
-- 3) Never expose the Supabase service-role key to the browser.
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('owner@example.com')
on conflict (user_id) do nothing;

-- NOTE: For a production deployment, consider a stricter review of report updates and
-- add server-side admin-only status management before public launch.