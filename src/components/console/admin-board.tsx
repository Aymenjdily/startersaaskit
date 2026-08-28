import { useEffect, useState } from "react";
import {
	type AdminUser,
	type BugReport,
	listReports,
	listUsers,
	REPORT_STATUSES,
	type ReportStatus,
	setReportStatus,
} from "@/lib/feedback";
import {
	listFeedback,
	type ProductFeedback,
	RATING_LABELS,
} from "@/lib/product-feedback";
import { cn } from "@/lib/utils";

const TABS = [
	{ id: "users", label: "Users" },
	{ id: "bugs", label: "Bugs" },
	{ id: "feedback", label: "Feedback" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The admin view: accounts, bug reports, and feedback.
 *
 * Feedback is its own tab rather than rows in the bug list, because it is a
 * different thing — a rating and an opinion with no lifecycle, against a defect
 * that gets triaged and closed. Mixed together, neither list says anything
 * true without filtering first.
 *
 * Both panels load only when their tab is opened. The user list joins three
 * tables and counts starters, and paying for it to sit behind a tab nobody
 * clicked is the sort of thing that makes an admin page slow for no reason.
 */
export function AdminBoard({ ready }: { ready: boolean }) {
	const [tab, setTab] = useState<TabId>("users");

	return (
		<div className="flex flex-col gap-6">
			{/* A real tablist: roving tabindex, arrow keys, panels that name the tab
			    that owns them. Two buttons and some state would look the same and be
			    unusable without a mouse. */}
			<div
				aria-label="Admin sections"
				className="flex w-fit gap-1 rounded-[10px] border border-white/10 bg-black/20 p-1"
				role="tablist"
			>
				{TABS.map((one) => (
					<button
						aria-controls="admin-panel"
						aria-selected={one.id === tab}
						className={cn(
							"rounded-[7px] px-3.5 py-1.5 text-[13px] transition-colors duration-200",
							one.id === tab
								? "bg-white/10 text-ink"
								: "text-white/60 hover:text-ink",
						)}
						id={`admin-tab-${one.id}`}
						key={one.id}
						onClick={() => setTab(one.id)}
						role="tab"
						tabIndex={one.id === tab ? 0 : -1}
						type="button"
					>
						{one.label}
					</button>
				))}
			</div>

			<div
				aria-labelledby={`admin-tab-${tab}`}
				id="admin-panel"
				role="tabpanel"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: a tabpanel whose content is not focusable has to be, or arrowing to a tab leaves nowhere to go
				tabIndex={0}
			>
				{tab === "users" && <Users ready={ready} />}
				{tab === "bugs" && <Bugs ready={ready} />}
				{tab === "feedback" && <Feedback ready={ready} />}
			</div>
		</div>
	);
}

/** Shared shell so both panels report loading and failure the same way. */
function Panel<T>({
	children,
	empty,
	load,
	ready,
}: {
	children: (rows: T[]) => React.ReactNode;
	empty: string;
	load: () => Promise<T[]>;
	ready: boolean;
}) {
	const [rows, setRows] = useState<T[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!ready) return;

		let live = true;

		load()
			.then((next) => live && setRows(next))
			.catch((thrown: unknown) => {
				if (!live) return;
				setRows([]);
				setError(thrown instanceof Error ? thrown.message : "Could not load.");
			});

		/* The tab can be switched before the request lands, and setting state on a
		   panel that is gone is a warning nobody can act on. */
		return () => {
			live = false;
		};
	}, [load, ready]);

	if (!ready || rows === null) {
		return <p className="text-[13px] text-ink-muted">Loading…</p>;
	}

	if (error) return <p className="text-[13px] text-diagram-red">{error}</p>;

	if (rows.length === 0) {
		return <p className="text-[13px] text-ink-muted">{empty}</p>;
	}

	return <>{children(rows)}</>;
}

/** A date a person can read, in their own locale, without a dependency. */
function when(value: string | null): string {
	if (!value) return "—";

	return new Date(value).toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function Table({ children }: { children: React.ReactNode }) {
	/* Scrolls inside its own frame rather than widening the page: an admin table
	   has more columns than a console pane has room for. */
	return (
		<div className="overflow-x-auto rounded-[10px] border border-white/10">
			<table className="w-full min-w-[720px] border-collapse text-left">
				{children}
			</table>
		</div>
	);
}

const TH =
	"border-white/10 border-b px-4 py-2.5 font-medium text-[12px] text-white/50";
const TD = "border-white/6 border-b px-4 py-3 text-[13px] text-white/80";

function Users({ ready }: { ready: boolean }) {
	return (
		<Panel<AdminUser> empty="No accounts yet." load={listUsers} ready={ready}>
			{(rows) => (
				<Table>
					<thead>
						<tr>
							<th className={TH} scope="col">
								Email
							</th>
							<th className={TH} scope="col">
								Name
							</th>
							<th className={TH} scope="col">
								Role
							</th>
							<th className={TH} scope="col">
								Joined
							</th>
							<th className={TH} scope="col">
								Last seen
							</th>
							<th className={TH} scope="col">
								Starters
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id}>
								<td className={cn(TD, "text-ink")}>{row.email ?? "—"}</td>
								<td className={TD}>{row.display_name ?? "—"}</td>
								<td className={TD}>{row.role ?? "—"}</td>
								<td className={TD}>{when(row.created_at)}</td>
								<td className={TD}>{when(row.last_sign_in_at)}</td>
								<td className={cn(TD, "tabular-nums")}>{row.starters}</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
		</Panel>
	);
}

const STATUS_TONE: Record<ReportStatus, string> = {
	open: "border-diagram-red/30 bg-diagram-red/10 text-diagram-red",
	triaged: "border-white/20 bg-white/8 text-ink",
	fixed: "border-sage/30 bg-sage/10 text-sage",
	wontfix: "border-white/10 bg-white/4 text-white/45",
};

function Bugs({ ready }: { ready: boolean }) {
	/* Bumped to force the panel to reload after a status change, rather than
	   patching the row locally and hoping the write succeeded. */
	const [round, setRound] = useState(0);

	return (
		<Panel<BugReport>
			empty="Nothing reported yet."
			key={round}
			load={listReports}
			ready={ready}
		>
			{(rows) => (
				<Table>
					<thead>
						<tr>
							<th className={TH} scope="col">
								Summary
							</th>
							<th className={TH} scope="col">
								Kind
							</th>
							<th className={TH} scope="col">
								Page
							</th>
							<th className={TH} scope="col">
								Filed
							</th>
							<th className={TH} scope="col">
								Status
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id}>
								<td className={cn(TD, "max-w-[320px] text-ink")}>
									<span className="block">{row.summary}</span>
									{row.detail && (
										<span className="mt-1 block text-[12px] text-white/45">
											{row.detail}
										</span>
									)}
								</td>
								<td className={TD}>{row.kind}</td>
								<td className={cn(TD, "font-mono text-[12px]")}>
									{row.path ?? "—"}
								</td>
								<td className={TD}>{when(row.created_at)}</td>
								<td className={TD}>
									{/* A select, not four buttons. Status is one value out of
									    four, which is what a select means, and it stays one
									    control wide however many statuses are added. */}
									<select
										aria-label={`Status for "${row.summary}"`}
										className={cn(
											"rounded-[6px] border px-2 py-1 text-[12px]",
											STATUS_TONE[row.status],
										)}
										onChange={async (event) => {
											await setReportStatus(
												row.id,
												event.target.value as ReportStatus,
											);
											setRound((n) => n + 1);
										}}
										value={row.status}
									>
										{REPORT_STATUSES.map((status) => (
											<option key={status} value={status}>
												{status}
											</option>
										))}
									</select>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
		</Panel>
	);
}

/**
 * What people said, newest first.
 *
 * The rating leads because it is the only sortable thing here, and "what are
 * you building" sits under the message rather than in its own column — it is
 * the answer most worth reading and the one most often empty, and a column of
 * dashes reads as missing data rather than an optional question.
 */
function Feedback({ ready }: { ready: boolean }) {
	return (
		<Panel<ProductFeedback>
			empty="No feedback yet."
			load={listFeedback}
			ready={ready}
		>
			{(rows) => (
				<Table>
					<thead>
						<tr>
							<th className={TH} scope="col">
								Rating
							</th>
							<th className={TH} scope="col">
								What they said
							</th>
							<th className={TH} scope="col">
								Page
							</th>
							<th className={TH} scope="col">
								Left
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id}>
								<td className={cn(TD, "whitespace-nowrap")}>
									<span className="font-medium tabular-nums text-ink">
										{row.rating}
									</span>
									<span className="ml-2 text-[12px] text-white/45">
										{RATING_LABELS[row.rating]}
									</span>
								</td>
								<td className={cn(TD, "max-w-[420px] text-ink")}>
									<span className="block">{row.message}</span>
									{row.building && (
										<span className="mt-1 block text-[12px] text-white/45">
											Building: {row.building}
										</span>
									)}
								</td>
								<td className={cn(TD, "font-mono text-[12px]")}>
									{row.path ?? "—"}
								</td>
								<td className={TD}>{when(row.created_at)}</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
		</Panel>
	);
}
