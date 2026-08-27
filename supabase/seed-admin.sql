-- Grants the admin role. Run this by hand in the Supabase SQL editor.
--
-- Deliberately *not* a numbered migration. Migrations run in every environment
-- including fresh ones, and this statement depends on a particular person
-- having already signed up — so as a migration it would fail every new database
-- until someone created that account, which is a confusing reason for a deploy
-- to break.
--
-- Requires `0003_feedback.sql` to have run first: that is what creates the
-- table this writes to.

do $$
declare
	target constant text := 'aymenjdily@gmail.com';
	account uuid;
begin
	select id into account from auth.users where email = target;

	-- Loudly, not silently. An `insert … select` that matches nothing succeeds
	-- and reports "0 rows", which reads like it worked — and the admin link
	-- stays hidden with no explanation. The overwhelmingly likely cause is that
	-- the account does not exist yet, so say that.
	if account is null then
		raise exception
			'No account for %. Sign up in the app first, then run this again.',
			target;
	end if;

	-- Idempotent: running it twice is not an error, and re-running after a
	-- restore is the normal way this gets used.
	insert into public.admins (user_id)
	values (account)
	on conflict (user_id) do nothing;

	raise notice '% is now an admin.', target;
end;
$$;

-- Check it took. Should return one row.
select u.email, a.created_at
from public.admins a
join auth.users u on u.id = a.user_id;
