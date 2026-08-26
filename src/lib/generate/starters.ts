import { backfillAnswers, type StarterAnswers } from "@/lib/starter-questions";
import { getSupabase } from "@/lib/supabase";
import { explain } from "@/lib/supabase-errors";

/** A starter as it is stored, and as the console lists it. */
export type StarterRecord = {
	id: string;
	project: string;
	answers: StarterAnswers;
	created_at: string;
};

/**
 * The starters this account has generated, newest first.
 *
 * Row level security scopes this to the owner, so there is no `user_id` filter
 * here — adding one would imply the query is what protects the data, and it is
 * not. The policy is.
 */
export async function listStarters(): Promise<StarterRecord[]> {
	const { data, error } = await getSupabase()
		.from("starters")
		.select("id, project, answers, created_at")
		.order("created_at", { ascending: false });

	if (error) throw new Error(explain(error));

	/* Read forward: a row written before a question existed is still a complete
	   starter, it just predates the question. See `backfillAnswers`. */
	return ((data ?? []) as StarterRecord[]).map(readStored);
}

export async function getStarter(id: string): Promise<StarterRecord | null> {
	const { data, error } = await getSupabase()
		.from("starters")
		.select("id, project, answers, created_at")
		.eq("id", id)
		.maybeSingle();

	if (error) throw new Error(explain(error));

	const record = (data as StarterRecord | null) ?? null;
	return record && readStored(record);
}

/** Deletes one. The row is the only record, so this is not reversible. */
export async function deleteStarter(id: string): Promise<void> {
	const { error } = await getSupabase().from("starters").delete().eq("id", id);

	if (error) throw new Error(explain(error));
}

/** One row, with answers to questions added after it was written filled in. */
function readStored(record: StarterRecord): StarterRecord {
	return { ...record, answers: backfillAnswers(record.answers) };
}
