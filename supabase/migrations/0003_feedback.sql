-- Bug reports, and the admin role that reads them.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) before the
-- report dialog can save anything or `/admin` can show anything.

-- ---------------------------------------------------------------------------
-- Who is an admin
-- ---------------------------------------------------------------------------
--
-- A table of its own rather than a column on `profiles`, and that is the whole
-- security design. `profiles` is updatable by its owner — that is what lets the
-- onboarding wizard save — so an `is_admin` column there would be a flag every
-- account could set on itself with one call from the browser console.
--
-- This table has a read policy and no write policies at all. Nothing holding
-- the publishable key can insert into it, whatever it claims to be. Adding an
-- admin is a deliberate act in the SQL editor:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';

create table if not exists public.admins (
	user_id uuid primary key references auth.users on delete cascade,
	created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- You may ask whether *you* are an admin. You may not enumerate the others.
drop policy if exists "admins can see their own row" on public.admins;
create policy "admins can see their own row"
	on public.admins for select
	using (auth.uid() = user_id);

/**
 * `security definer` so the policies below can call it.
 *
 * A policy on `bug_reports` that selected from `admins` directly would be
 * evaluated as the calling user, hit the policy above, and only ever see their
 * own row — which happens to work here but stops working the moment the
 * membership check needs to look at anyone else. Definer rights make the check
 * mean "is this user in the table", not "can this user see that they are".
 *
 * `search_path` is pinned. Without it a caller can point `public` at a schema
 * of their own and have a definer function run their `admins` table instead of
 * ours.
 */
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
	select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- The reports themselves
-- ---------------------------------------------------------------------------

create table if not exists public.bug_reports (
	id uuid primary key default gen_random_uuid(),

	-- `set null`, not `cascade`. A report outlives the account that filed it:
	-- deleting a user should not delete the evidence of a bug they found.
	user_id uuid references auth.users on delete set null,

	kind text not null default 'bug' check (kind in ('bug', 'idea', 'question')),

	-- Bounded in the database as well as the form. The form is a convenience;
	-- this is the rule. An empty summary is not a report, and a megabyte of it
	-- is not one either.
	summary text not null check (char_length(trim(summary)) between 3 and 140),
	detail text check (detail is null or char_length(detail) <= 4000),

	-- Captured rather than asked for. "Which page were you on" is a question
	-- nobody answers accurately, and the browser already knows.
	path text check (path is null or char_length(path) <= 300),
	user_agent text check (user_agent is null or char_length(user_agent) <= 400),

	status text not null default 'open'
		check (status in ('open', 'triaged', 'fixed', 'wontfix')),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- The admin list is "everything, newest first", filtered by status.
create index if not exists bug_reports_status_created_idx
	on public.bug_reports (status, created_at desc);

alter table public.bug_reports enable row level security;

-- Anyone signed in may file one, against their own id and nobody else's.
drop policy if exists "reports are insertable by their author" on public.bug_reports;
create policy "reports are insertable by their author"
	on public.bug_reports for insert
	with check (auth.uid() = user_id);

-- You can see what you filed. Admins can see everything.
drop policy if exists "reports are readable by author or admin" on public.bug_reports;
create policy "reports are readable by author or admin"
	on public.bug_reports for select
	using (auth.uid() = user_id or public.is_admin());

-- Only admins move a report along. Deliberately no author update policy: an
-- author who could edit `status` could mark their own report fixed, and one who
-- could edit `summary` could change what was reported after it was triaged.
drop policy if exists "reports are updatable by admins" on public.bug_reports;
create policy "reports are updatable by admins"
	on public.bug_reports for update
	using (public.is_admin())
	with check (public.is_admin());

drop trigger if exists bug_reports_touch_updated_at on public.bug_reports;
create trigger bug_reports_touch_updated_at
	before update on public.bug_reports
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- The user list
-- ---------------------------------------------------------------------------
--
-- `auth.users` is not reachable from the client, and it should not be. This
-- function is the one window onto it, and it is a narrow one: four columns,
-- admins only, and it raises rather than returning an empty set when someone
-- who is not an admin calls it — a silent empty list is indistinguishable from
-- "no users yet" and hides a broken permission.
--
-- `profiles` is joined in for the onboarding answers, and starters are counted
-- rather than listed. Nothing here returns a password hash, a token, or the
-- provider identity payload.

create or replace function public.admin_user_rows()
returns table (
	id uuid,
	email text,
	display_name text,
	role text,
	created_at timestamptz,
	last_sign_in_at timestamptz,
	onboarded_at timestamptz,
	starters bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
	if not public.is_admin() then
		raise exception 'not authorised';
	end if;

	return query
		select
			u.id,
			u.email::text,
			p.display_name,
			p.role,
			u.created_at,
			u.last_sign_in_at,
			p.onboarded_at,
			count(s.id) as starters
		from auth.users u
		left join public.profiles p on p.id = u.id
		left join public.starters s on s.user_id = u.id
		group by u.id, u.email, p.display_name, p.role, u.created_at,
		         u.last_sign_in_at, p.onboarded_at
		order by u.created_at desc;
end;
$$;

-- `authenticated` only. `anon` holds the same publishable key every visitor
-- gets, and the guard inside is the second lock, not the first.
revoke all on function public.admin_user_rows() from public, anon;
grant execute on function public.admin_user_rows() to authenticated;
