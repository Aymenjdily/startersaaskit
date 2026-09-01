-- Self-service account deletion.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) after 0007.
--
-- Deleting the row in `auth.users` is what actually removes an account —
-- Supabase's own admin API does exactly this under the hood, and every table
-- that owns a row per account already knows how to react to it: `profiles`,
-- `starters` and `admins` cascade (0001, 0002, 0003), while `bug_reports` and
-- `product_feedback` keep their rows and set `user_id` to null instead (0003,
-- 0007) — a report outlives the account that filed it.
--
-- The publishable key every browser holds has no privilege to touch
-- `auth.users` directly, which is the point: nothing client-side should be
-- able to delete *anyone's* account. `security definer` lends this function
-- the owning role's privilege for exactly one statement, and `auth.uid()`
-- scopes that one statement so it can never reach a row that is not the
-- caller's own — the same shape as `create_starter` and
-- `claim_feedback_reward` in 0006.

create or replace function public.delete_own_account()
returns void
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

	delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
