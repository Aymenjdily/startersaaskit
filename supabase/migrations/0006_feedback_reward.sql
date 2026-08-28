-- Generations become a per-account balance, and feedback earns more of them.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) after 0005.
--
-- Until now the limit was the literal 5 inside `create_starter`, which is fine
-- while everybody gets the same allowance and impossible the moment one account
-- should get more. It moves onto `profiles` so it can differ per account, and
-- `claim_feedback_reward` is the one thing that raises it.
--
-- ## The hole this also closes
--
-- 0001 gave owners a blanket update policy on `profiles`:
--
--     create policy "profiles are updatable by their owner"
--       on public.profiles for update using (auth.uid() = id) ...
--
-- RLS decides *which rows* a statement may touch; it says nothing about which
-- columns. Supabase grants `authenticated` UPDATE on the whole table, so since
-- 0004 added `generations_used` there, any signed-in browser could PATCH its
-- own row and set the counter back to zero — spending a token, then refunding
-- it, for as long as it liked. The quota has been bypassable that way the whole
-- time it has existed.
--
-- Adding `generation_limit` beside it would have made that worse: not a refund
-- but an unlimited allowance, one request wide.
--
-- The fix is column privileges, which is the level the question is actually
-- asked at. `authenticated` keeps UPDATE and INSERT on exactly the columns the
-- onboarding wizard writes and loses them everywhere else, so the three columns
-- that decide what an account is owed can only be moved by the definer
-- functions below. `quota.sql.test.ts` holds the granted list to the wizard's
-- own list, so adding a question without widening this fails rather than
-- silently breaking onboarding.

alter table public.profiles
	add column if not exists generation_limit integer not null default 5
		check (generation_limit >= 0);

-- Null until claimed, and the reason the reward can only be taken once.
alter table public.profiles
	add column if not exists feedback_reward_at timestamptz;

-- ---------------------------------------------------------------------------
-- Only the wizard's own columns are client-writable
-- ---------------------------------------------------------------------------

revoke insert, update on public.profiles from authenticated;

/* `id` is included because the wizard upserts, which writes the key on both
   halves of the statement. The insert policy's `with check (auth.uid() = id)`
   is what stops it being someone else's. */
grant insert (
	id, display_name, role, team_size, building, timeline,
	friction, framework, heard_from, notes, onboarded_at
) on public.profiles to authenticated;

grant update (
	id, display_name, role, team_size, building, timeline,
	friction, framework, heard_from, notes, onboarded_at
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Spending against the balance
-- ---------------------------------------------------------------------------
--
-- Unchanged from 0005 except that the ceiling is now the column rather than a
-- literal 5. The `#variable_conflict` directive stays: `id` and `project` are
-- still both OUT parameters and column names, and dropping it would bring back
-- the ambiguity that made every non-admin call throw.

create or replace function public.create_starter(p_answers jsonb, p_project text)
returns table (id uuid, project text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
	v_user uuid := auth.uid();
begin
	if v_user is null then
		raise exception 'not signed in';
	end if;

	if not public.is_admin() then
		insert into public.profiles (id)
		values (v_user)
		on conflict (id) do nothing;

		update public.profiles
			set generations_used = generations_used + 1
			where profiles.id = v_user
				and generations_used < generation_limit;

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

revoke all on function public.create_starter(jsonb, text) from public, anon;
grant execute on function public.create_starter(jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Earning more of it
-- ---------------------------------------------------------------------------

/**
 * Grants ten generations in exchange for feedback, once per account.
 *
 * Three things have to hold, and all three are checked here rather than in the
 * handler, because the handler is a request anyone can forge:
 *
 * - there is a session, so the reward lands on a real account
 * - that account has actually filed a report, so the button cannot pay out to
 *   somebody who merely opened the dialog and closed it
 * - `feedback_reward_at` is still null, and the same UPDATE that pays out
 *   stamps it — so two requests racing cannot both find it unclaimed
 *
 * Deliberately not "ten per report". Feedback is worth paying for once; paying
 * per submission prices a queue of empty reports at ten generations each.
 */
create or replace function public.claim_feedback_reward()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
	v_user uuid := auth.uid();
	v_limit integer;
begin
	if v_user is null then
		raise exception 'not signed in';
	end if;

	if not exists (
		select 1 from public.bug_reports r where r.user_id = v_user
	) then
		raise exception 'no feedback to reward';
	end if;

	insert into public.profiles (id)
	values (v_user)
	on conflict (id) do nothing;

	update public.profiles
		set generation_limit = generation_limit + 10,
			feedback_reward_at = now()
		where profiles.id = v_user and feedback_reward_at is null
		returning generation_limit into v_limit;

	if not found then
		raise exception 'reward already claimed';
	end if;

	return v_limit;
end;
$$;

-- Same reasoning as `create_starter`: the publishable key every visitor holds
-- should not be able to call this.
revoke all on function public.claim_feedback_reward() from public, anon;
grant execute on function public.claim_feedback_reward() to authenticated;
