-- Fixes `create_starter` throwing on the non-admin path.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) after 0004. It
-- only replaces the function; nothing about the table or the quota changes.
--
-- ## What was wrong
--
-- `returns table (id uuid, project text)` declares two PL/pgSQL variables, `id`
-- and `project`, alongside the columns of the same name. Most of the body
-- qualifies its references and so was never at risk, but one line did not:
--
--     insert into public.profiles (id) values (v_user) on conflict (id) do nothing;
--
-- An INSERT's column list is not an expression and is left alone, but the
-- `on conflict` target is an index inference clause, which PL/pgSQL does
-- substitute into. `id` there matches both the variable and the column, and
-- Postgres refuses to guess:
--
--     42702: column reference "id" is ambiguous
--
-- It is a runtime error rather than a creation error, because PL/pgSQL prepares
-- expressions on first execution — which is why 0004 applied cleanly and every
-- call then failed. Admins never saw it: the whole block is inside
-- `if not public.is_admin()`, so the only accounts that could hit it were the
-- ones the quota applies to. Every one of them.
--
-- ## The fix
--
-- `#variable_conflict use_column` tells PL/pgSQL to read an ambiguous name as
-- the column, which is what every such reference in this function means. The
-- alternative — renaming the OUT parameters — would rename the JSON keys
-- PostgREST returns, and the handler and console both read `id`.

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

-- Unchanged from 0004, repeated because `create or replace` does not carry
-- grants across on a fresh database where this file is the first to define it.
revoke all on function public.create_starter(jsonb, text) from public, anon;
grant execute on function public.create_starter(jsonb, text) to authenticated;
