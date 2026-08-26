-- One row per starter generated, so `/starters` can list something real.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) before the
-- generate button will record anything. Generation itself still works without
-- it — the download is served and the failure to record is logged — because
-- losing the artifact someone just waited for is worse than losing the row.

create table if not exists public.starters (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users on delete cascade,

	-- The repository name, duplicated out of `answers` so the list can be
	-- ordered and searched without unpacking jsonb on every row.
	project text not null,

	-- The whole answer set, as given. Deliberately jsonb and deliberately not
	-- constrained: this is a record of what someone asked for at a point in
	-- time, and it must stay readable after the menu moves on. `profiles` is
	-- the opposite case — there the columns are the point.
	answers jsonb not null,

	created_at timestamptz not null default now()
);

-- Listing is "mine, newest first", which is this index exactly.
create index if not exists starters_user_created_idx
	on public.starters (user_id, created_at desc);

alter table public.starters enable row level security;

-- Without these, the publishable key reads every account's answers — and the
-- answer set is a fair description of what someone is building.
drop policy if exists "starters are readable by their owner" on public.starters;
create policy "starters are readable by their owner"
	on public.starters for select
	using (auth.uid() = user_id);

drop policy if exists "starters are insertable by their owner" on public.starters;
create policy "starters are insertable by their owner"
	on public.starters for insert
	with check (auth.uid() = user_id);

-- No update policy on purpose. A generated starter is a historical fact; if the
-- answers change, that is a new row, not an edit to an old one.

drop policy if exists "starters are deletable by their owner" on public.starters;
create policy "starters are deletable by their owner"
	on public.starters for delete
	using (auth.uid() = user_id);
