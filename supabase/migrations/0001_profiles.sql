-- Onboarding answers, one row per account.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) before the
-- onboarding wizard can save anything.
--
-- The allowed values below are duplicated from `src/lib/onboarding.ts`, which is
-- the source of truth. They are not free text on purpose: the reason to collect
-- this at all is to be able to group by it later, and a typo'd value silently
-- becomes its own category. `src/lib/onboarding.sql.test.ts` fails if the two
-- ever disagree, so widen this file in the same commit that adds an option.

create table if not exists public.profiles (
	id uuid primary key references auth.users on delete cascade,

	display_name text,

	role text check (role in (
		'solo_founder', 'startup_team', 'freelancer', 'agency', 'employee', 'learning'
	)),

	team_size text check (team_size in (
		'just_me', '2_5', '6_20', '20_plus'
	)),

	building text check (building in (
		'b2b_saas', 'consumer', 'internal', 'client_work', 'ai_app', 'side_project'
	)),

	timeline text check (timeline in (
		'this_week', 'this_month', 'this_quarter', 'exploring'
	)),

	-- Multi-select: every element has to be one of ours, and an empty array is
	-- not an answer, so the wizard's "at least one" rule holds in the database
	-- too rather than only in the browser.
	friction text[] check (
		friction is null or (
			array_length(friction, 1) > 0
			and friction <@ array[
				'auth', 'billing', 'database', 'testing',
				'ci_deploy', 'design_system', 'emails'
			]::text[]
		)
	),

	framework text check (framework in (
		'nextjs', 'tanstack_start', 'either', 'something_else'
	)),

	heard_from text check (heard_from in (
		'search', 'social', 'video', 'friend', 'ai_assistant', 'other'
	)),

	notes text,

	-- Null until the wizard is finished. This is what the route reads to decide
	-- whether to show onboarding or wave someone through to the console, so a
	-- half-filled row does not count as done.
	onboarded_at timestamptz,

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Without these, the anon key can read every row in the table. The wizard runs
-- in the browser with that key, so each policy is the only thing standing
-- between one account's answers and everyone else's.
drop policy if exists "profiles are readable by their owner" on public.profiles;
create policy "profiles are readable by their owner"
	on public.profiles for select
	using (auth.uid() = id);

drop policy if exists "profiles are insertable by their owner" on public.profiles;
create policy "profiles are insertable by their owner"
	on public.profiles for insert
	with check (auth.uid() = id);

drop policy if exists "profiles are updatable by their owner" on public.profiles;
create policy "profiles are updatable by their owner"
	on public.profiles for update
	using (auth.uid() = id)
	with check (auth.uid() = id);

-- `updated_at` is worth nothing if the client is the one setting it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
	before update on public.profiles
	for each row execute function public.touch_updated_at();
