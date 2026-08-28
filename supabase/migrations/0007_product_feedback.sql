-- Product feedback, in a table of its own.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) after 0006.
--
-- ## Why not `bug_reports`
--
-- The reward dialog reused the bug report form, and the two are not the same
-- thing. A bug report is a defect with a lifecycle — open, triaged, fixed,
-- wontfix — and it is worth keeping after the account that filed it is gone.
-- Feedback is somebody's opinion at a point in time: it has a rating, it is
-- never "fixed", and reading it in a queue of defects buries both.
--
-- Sharing one table would have meant a `kind` that half the columns ignore, a
-- `status` that means nothing on half the rows, and an admin list that has to
-- filter before it says anything true.

create table if not exists public.product_feedback (
	id uuid primary key default gen_random_uuid(),

	-- `set null`, like a bug report: the opinion outlives the account, and the
	-- reward it paid for has already been spent against `profiles`.
	user_id uuid references auth.users on delete set null,

	-- 1 to 5. Bounded here rather than only in the form, because the number is
	-- the one field anything will ever be averaged over.
	rating smallint not null check (rating between 1 and 5),

	-- The answer worth reading. Bounded at both ends: two characters is not an
	-- opinion, and the reward makes a wall of pasted text worth guarding against.
	message text not null check (char_length(trim(message)) between 10 and 2000),

	-- Optional, and the most useful field for deciding what to build next.
	building text check (building is null or char_length(building) <= 300),

	-- Captured, not asked for.
	path text check (path is null or char_length(path) <= 300),
	user_agent text check (user_agent is null or char_length(user_agent) <= 400),

	created_at timestamptz not null default now()
);

-- The admin list is "everything, newest first".
create index if not exists product_feedback_created_idx
	on public.product_feedback (created_at desc);

alter table public.product_feedback enable row level security;

-- Anyone signed in may leave it, against their own id and nobody else's.
drop policy if exists "feedback is insertable by its author" on public.product_feedback;
create policy "feedback is insertable by its author"
	on public.product_feedback for insert
	with check (auth.uid() = user_id);

-- You can see what you wrote. Admins can see everything.
drop policy if exists "feedback is readable by author or admin" on public.product_feedback;
create policy "feedback is readable by author or admin"
	on public.product_feedback for select
	using (auth.uid() = user_id or public.is_admin());

-- No update policy and no delete policy, for anyone. An opinion with a date on
-- it is only worth having if it cannot be revised after the fact, and the
-- reward means an editable row is a way to claim once and rewrite forever.

-- ---------------------------------------------------------------------------
-- The reward now pays for feedback, not for bug reports
-- ---------------------------------------------------------------------------
--
-- Unchanged from 0006 except for the table it looks in. Filing a bug is still
-- worth doing and still free; the ten generations are for the thing the button
-- actually asks for.

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
		select 1 from public.product_feedback f where f.user_id = v_user
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

revoke all on function public.claim_feedback_reward() from public, anon;
grant execute on function public.claim_feedback_reward() to authenticated;
