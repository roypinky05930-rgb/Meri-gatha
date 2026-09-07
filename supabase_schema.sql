-- MERI GATHA COMMUNITY DATABASE
-- Run this entire file in Supabase SQL Editor.
-- This creates:
--   thoughts          -> visitor submissions + moderation
--   contact_messages  -> contact form
--   like_thought()    -> safe server-side increment for approved posts
--
-- IMPORTANT:
-- Never put a Supabase service_role/secret key in the website.

create extension if not exists pgcrypto;

create table if not exists public.thoughts (
  id uuid primary key default gen_random_uuid(),
  nickname text not null default 'Anonymous',
  category text not null default 'Thought',
  content text not null check (char_length(content) between 1 and 600),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.thoughts enable row level security;
alter table public.contact_messages enable row level security;

-- Visitors can read approved thoughts only.
drop policy if exists "Anyone can read approved thoughts" on public.thoughts;
create policy "Anyone can read approved thoughts"
on public.thoughts for select
to anon, authenticated
using (status = 'approved');

-- Visitors may submit a thought, but it always starts pending.
drop policy if exists "Anyone can submit pending thoughts" on public.thoughts;
create policy "Anyone can submit pending thoughts"
on public.thoughts for insert
to anon, authenticated
with check (
  status = 'pending'
  and likes = 0
  and char_length(content) between 1 and 600
);

-- Contact form: visitors can send, but cannot read messages back.
drop policy if exists "Anyone can send contact messages" on public.contact_messages;
create policy "Anyone can send contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (
  char_length(name) between 1 and 60
  and char_length(email) between 3 and 120
  and char_length(message) between 1 and 1000
);

-- Secure like counter. Only approved posts can be liked.
create or replace function public.like_thought(thought_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.thoughts
  set likes = likes + 1
  where id = thought_id
    and status = 'approved'
  returning likes into new_count;

  if new_count is null then
    raise exception 'Thought not found or not approved';
  end if;

  return new_count;
end;
$$;

revoke all on function public.like_thought(uuid) from public;
grant execute on function public.like_thought(uuid) to anon, authenticated;

-- Do not allow direct visitor updates/deletes.
revoke update, delete on public.thoughts from anon, authenticated;
revoke select, update, delete on public.contact_messages from anon, authenticated;

-- MODERATION:
-- For now, approve/reject posts from Supabase Dashboard:
-- Table Editor -> thoughts -> change status to approved/rejected.
--
-- Keep contact_messages private; read them only from the authenticated
-- Supabase dashboard/admin tools.
