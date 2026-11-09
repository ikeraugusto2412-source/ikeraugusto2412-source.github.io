-- Reel comments for the portfolio (paste into Supabase › SQL Editor › New query › Run).
-- Anyone can read visible comments and add new ones; nobody but you (from the Supabase
-- dashboard) can edit, hide or delete them. To hide a comment, set hidden = true in
-- Table Editor › comments, or delete the row.

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  project text not null check (char_length(project) between 1 and 40),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_project_created on public.comments (project, created_at);

alter table public.comments enable row level security;

-- Visitors may only see visible comments and only send these three fields
revoke all on public.comments from anon, authenticated;
grant select (id, project, name, body, created_at) on public.comments to anon;
grant insert (project, name, body) on public.comments to anon;

drop policy if exists "read visible comments" on public.comments;
create policy "read visible comments" on public.comments
  for select to anon using (hidden = false);

drop policy if exists "add comments" on public.comments;
create policy "add comments" on public.comments
  for insert to anon with check (hidden = false);

-- Light spam brake: at most 20 comments a minute across the whole site, and no repeating
-- the same comment within an hour
create or replace function public.comments_brake() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from comments where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many comments, try again in a minute';
  end if;
  if exists (select 1 from comments where project = new.project and body = new.body
             and created_at > now() - interval '1 hour') then
    raise exception 'Duplicate comment';
  end if;
  return new;
end $$;

drop trigger if exists comments_brake on public.comments;
create trigger comments_brake before insert on public.comments
  for each row execute function public.comments_brake();
