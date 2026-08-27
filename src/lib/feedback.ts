import { getSupabase } from "@/lib/supabase";
import { explain } from "@/lib/supabase-errors";

/** What a report can be. Mirrors the check constraint in `0003_feedback.sql`. */
export const REPORT_KINDS = ["bug", "idea", "question"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

/** Where a report can get to. Mirrors the same migration. */
export const REPORT_STATUSES = ["open", "triaged", "fixed", "wontfix"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/**
 * The limits, duplicated from the database on purpose.
 *
 * The constraint in Postgres is the rule; this is the courtesy. Validating only
 * in the browser means a 141st character comes back as a constraint violation
 * the person cannot act on, and validating only in the database means they find
 * out after the round trip. `feedback.sql.test.ts` fails if the two disagree.
 */
export const SUMMARY_MIN = 3;
export const SUMMARY_MAX = 140;
export const DETAIL_MAX = 4000;

export type BugReport = {
	id: string;
	user_id: string | null;
	kind: ReportKind;
	summary: string;
	detail: string | null;
	path: string | null;
	user_agent: string | null;
	status: ReportStatus;
	created_at: string;
};

const COLUMNS =
	"id, user_id, kind, summary, detail, path, user_agent, status, created_at";

/** What is wrong with a summary, or nothing if it is fine. */
export function summaryProblem(summary: string): string | null {
	const trimmed = summary.trim();

	if (trimmed.length < SUMMARY_MIN) return "Give it a one-line summary.";
	if (trimmed.length > SUMMARY_MAX) {
		return `Keep the summary under ${SUMMARY_MAX} characters.`;
	}
	return null;
}

/**
 * Files a report.
 *
 * `path` and `user_agent` are read here rather than passed in, because the two
 * questions they replace — "which page were you on" and "which browser" — are
 * the two a bug report most often gets wrong.
 */
export async function fileReport(input: {
	kind: ReportKind;
	summary: string;
	detail?: string;
}): Promise<void> {
	const problem = summaryProblem(input.summary);

	if (problem) throw new Error(problem);

	const supabase = getSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	/* The insert policy checks `auth.uid() = user_id`, so a missing session is a
	   row the database will refuse. Saying so here beats surfacing that as a
	   policy violation. */
	if (!user) throw new Error("You need to be signed in to send a report.");

	const detail = input.detail?.trim();

	const { error } = await supabase.from("bug_reports").insert({
		user_id: user.id,
		kind: input.kind,
		summary: input.summary.trim(),
		detail: detail ? detail.slice(0, DETAIL_MAX) : null,
		path:
			typeof window === "undefined"
				? null
				: `${window.location.pathname}${window.location.search}`.slice(0, 300),
		user_agent:
			typeof navigator === "undefined"
				? null
				: navigator.userAgent.slice(0, 400),
	});

	if (error) throw new Error(explain(error));
}

/**
 * Every report, newest first.
 *
 * No admin filter in the query. The select policy already scopes this — an
 * admin sees everything, anyone else sees only what they filed — and adding a
 * filter here would suggest the query is what protects the data. It is not.
 */
export async function listReports(): Promise<BugReport[]> {
	const { data, error } = await getSupabase()
		.from("bug_reports")
		.select(COLUMNS)
		.order("created_at", { ascending: false });

	if (error) throw new Error(explain(error));

	return (data ?? []) as BugReport[];
}

/** Moves a report along. The update policy admits admins only. */
export async function setReportStatus(
	id: string,
	status: ReportStatus,
): Promise<void> {
	const { error } = await getSupabase()
		.from("bug_reports")
		.update({ status })
		.eq("id", id);

	if (error) throw new Error(explain(error));
}

export type AdminUser = {
	id: string;
	email: string | null;
	display_name: string | null;
	role: string | null;
	created_at: string;
	last_sign_in_at: string | null;
	onboarded_at: string | null;
	starters: number;
};

/**
 * The accounts, via the guarded function in the migration.
 *
 * `auth.users` has no client-side reachable API, which is correct — this goes
 * through `admin_user_rows()`, which checks membership itself and raises for
 * anyone else rather than returning nothing.
 */
export async function listUsers(): Promise<AdminUser[]> {
	const { data, error } = await getSupabase().rpc("admin_user_rows");

	if (error) throw new Error(explain(error));

	return (data ?? []) as AdminUser[];
}

/**
 * Whether the signed-in account is an admin.
 *
 * Used to decide whether to *show* the admin link. It is not what protects the
 * data — the policies are — and it must not be mistaken for that: hiding a
 * route in a client bundle hides nothing.
 */
export async function isAdmin(): Promise<boolean> {
	const { data, error } = await getSupabase().rpc("is_admin");

	if (error) return false;

	return data === true;
}
