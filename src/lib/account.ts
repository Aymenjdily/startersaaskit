import { getSupabase } from "@/lib/supabase";
import { explain } from "@/lib/supabase-errors";

/**
 * Saves a new display name to both places it lives.
 *
 * `user_metadata.full_name` is the one `displayNameFor` (in `console-nav.ts`)
 * actually reads, so it is what makes the change visible in the rail, the
 * navbar and everywhere else a name is shown — `auth.updateUser` is the
 * client's own session updating its own account, no elevated privilege
 * needed. `profiles.display_name` is updated alongside it so the column is
 * not a value the onboarding wizard writes once and nothing ever reads again.
 */
export async function updateDisplayName(name: string): Promise<void> {
	const supabase = getSupabase();
	const trimmed = name.trim();

	const { data, error: authFailure } = await supabase.auth.updateUser({
		data: { full_name: trimmed },
	});
	if (authFailure) throw new Error(explain(authFailure));

	const userId = data.user?.id;
	if (!userId) return;

	const { error: profileFailure } = await supabase
		.from("profiles")
		.update({ display_name: trimmed })
		.eq("id", userId);
	if (profileFailure) throw new Error(explain(profileFailure));
}

/**
 * Deletes the signed-in account, permanently.
 *
 * Everything the account owns goes with it — every generated starter, the
 * onboarding profile, admin membership if it held any. Bug reports and
 * product feedback stay, with the account unlinked from them rather than
 * deleted alongside them; see `0008_delete_own_account.sql` for why.
 *
 * Throws rather than swallowing: a failed delete has to be shown, not mistaken
 * for a successful one that just did not redirect.
 */
export async function deleteOwnAccount(): Promise<void> {
	const { error } = await getSupabase().rpc("delete_own_account");
	if (error) throw new Error(explain(error));
}
