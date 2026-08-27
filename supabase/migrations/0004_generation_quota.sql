-- The generation quota: five starters per account, enforced in the database.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) after
-- 0002_starters.sql — it replaces that migration's insert policy.
--
-- Why a counter and not a row count: `starters` is deletable by its owner, so
-- counting rows would hand back a token every time someone tidies their list,
-- and the quota would stop meaning anything against anyone willing to click
-- delete. The counter only moves one way.
--
-- The limit itself is duplicated in `src/lib/quota.ts`, which the console reads
-- to say how many are left. `src/lib/quota.sql.test.ts` fails if the two
-- disagree, so change both in the same commit.

alter table public.profiles
	add column if not exists generations_used integer not null default 0
	check (generations_used >= 0);

-- ---------------------------------------------------------------------------
-- The only way in
-- ---------------------------------------------------------------------------
--
-- The 0002 insert policy let any signed-in browser write a starter directly,
-- which is a quota bypass one PostgREST call wide. Creation now goes through
-- `create_starter` below and nowhere else; reads and deletes keep their owner
-- policies, which leak nothing and cost nothing.

drop policy if exists "starters are insertable by their owner" on public.starters;

/**
 * Creates a starter and spends one generation, atomically.
 *
 * `security definer` because it writes `generations_used` on a table the owner
 * can otherwise update freely — a `profiles` update policy that let the wizard
 * save would also let a browser set its own counter back to zero. Definer
 * rights are what make the counter the database's number rather than the
 * client's. `search_path` is pinned for the same reason as in 0003.
 *
 * The quota check and the increment are one UPDATE, so two requests arriving
 * together cannot both squeeze under the limit: the second finds
 * `generations_used < 5` already false. The starter is inserted only after the
 * token is spent, and inside the same transaction — a failed insert rolls the
 * spend back with it.
 *
 * Admins are exempt: dogfooding the generator should not require a second
 * account, and the exemption lives here rather than in the handler so it
 * cannot be claimed by a header.
 */
create or replace function public.create_starter(p_answers jsonb, p_project text)
returns table (id uuid, project text)
language plpgsql
security definer
set search_path = public
as $$
declare
	v_user uuid := auth.uid();
begin
	if v_user is null then
		raise exception 'not signed in';
	end if;

	if not public.is_admin() then
		/* A signed-in account may have skipped onboarding and have no profile
		   row yet; the counter has to exist before it can be spent. */
		insert into public.profiles (id)
		values (v_user)
		on conflict (id) do nothing;

		update public.profiles
			set generations_used = generations_used + 1
			where profiles.id = v_user and generations_used < 5;

		if not found then
			raise exception 'generation quota exhausted';
		end if;
	end if;

	return query
		insert into public.starters (user_id, answers, project)
		values (v_user, p_answers, p_project)
		returning starters.id, starters.project;
end;
$$;

-- Same reasoning as `admin_user_rows`: the publishable key every visitor holds
-- should not be able to call this, signed in or not.
revoke all on function public.create_starter(jsonb, text) from public, anon;
grant execute on function public.create_starter(jsonb, text) to authenticated;
