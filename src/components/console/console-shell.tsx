import { createContext, useContext, useEffect, useState } from "react";
import { SIGN_IN_HREF } from "@/lib/brand";
import { isAdmin as checkAdmin } from "@/lib/feedback";
import { getSupabase } from "@/lib/supabase";
import { FeedbackDialog } from "./feedback-dialog";
import { IconRail, type RailUser } from "./icon-rail";
import { ReportDialog } from "./report-dialog";
import { ConsoleChromeSkeleton } from "./skeletons";

/**
 * Which dialog a child is asking the shell to open.
 *
 * Two dialogs, not one wearing two titles: a bug report is a defect with a
 * lifecycle, feedback is a rating and an opinion, and they are written to
 * different tables.
 */
export type ConsoleDialog = "report" | "feedback";

/**
 * Opens one of the shell's dialogs from anywhere inside the console.
 *
 * The dialog is the shell's, because the rail's report button is the shell's.
 * A page that wants to offer the same thing — the generation balance does —
 * would otherwise have to be handed a callback through every layer between,
 * or own a second dialog that behaves subtly differently from the first.
 */
const OpenReport = createContext<(which?: ConsoleDialog) => void>(() => {});

export function useOpenReport(): (which?: ConsoleDialog) => void {
	return useContext(OpenReport);
}

/**
 * The frame every signed-in page sits in: an icon rail, a top bar that names
 * the page, and the working area.
 *
 * It owns the session because the rail should not — a presentational rail that
 * fetches its own user cannot be rendered in a test, and every page would
 * fetch the same user again.
 *
 * Nothing renders until we know who is asking. Showing the console first and
 * bouncing afterwards flashes someone else's shell at a signed-out visitor.
 */
export function ConsoleShell({
	actions,
	back,
	children,
	currentPath,
	onReportSent,
	title,
}: {
	/** Buttons for the top bar's right side, opposite the title. */
	actions?: React.ReactNode;
	/** Where a nested page goes back to. Absent on top-level pages. */
	back?: { href: string; label: string };
	children: React.ReactNode;
	currentPath: string;
	/** Fired once a report has been written, for pages that reward it. */
	onReportSent?: () => void;
	title: string;
}) {
	const [user, setUser] = useState<RailUser | null>(null);
	const [admin, setAdmin] = useState(false);
	/* Which dialog is open, or `null` for none. */
	const [dialog, setDialog] = useState<ConsoleDialog | null>(null);

	useEffect(() => {
		getSupabase()
			.auth.getUser()
			.then(({ data }) => {
				if (!data.user) {
					window.location.replace(SIGN_IN_HREF);
					return;
				}
				setUser(data.user);

				/* Whether to draw the admin row. Deliberately not awaited with the
				   session: the console should not wait on a permission check that
				   only decides one icon, and a false answer costs nothing because
				   the route and its data are protected by policy either way. */
				checkAdmin().then(setAdmin);
			})
			.catch(() => window.location.replace(SIGN_IN_HREF));
	}, []);

	async function signOut() {
		await getSupabase().auth.signOut();
		window.location.assign("/");
	}

	if (!user) return <ConsoleChromeSkeleton title={title} />;

	return (
		<OpenReport.Provider value={(which = "report") => setDialog(which)}>
			<div className="flex min-h-screen bg-surface">
				<IconRail
					currentPath={currentPath}
					isAdmin={admin}
					onReport={() => setDialog("report")}
					onSignOut={signOut}
					user={user}
				/>

				<ReportDialog
					onClose={() => setDialog(null)}
					open={dialog === "report"}
				/>

				<FeedbackDialog
					onClose={() => setDialog(null)}
					onSent={onReportSent}
					open={dialog === "feedback"}
				/>

				<div className="flex min-w-0 flex-1 flex-col">
					<header className="flex h-14 shrink-0 items-center gap-3 border-white/8 border-b px-4 md:px-6">
						{back && (
							<a
								aria-label={back.label}
								className="-ml-1 flex size-8 items-center justify-center rounded-[8px] text-white/50 transition-colors duration-200 hover:bg-white/6 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								href={back.href}
								title={back.label}
							>
								<svg
									aria-hidden="true"
									className="size-4"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.5"
									viewBox="0 0 24 24"
								>
									<path d="M15 5l-7 7 7 7" />
								</svg>
								{/* Real text, not only `aria-label`: an anchor whose whole
							    content is a decorative SVG has no accessible name at all
							    if the attribute is ever dropped in a refactor. */}
								<span className="sr-only">{back.label}</span>
							</a>
						)}

						<h1 className="min-w-0 truncate font-medium text-[15px] text-ink tracking-[-0.01em]">
							{title}
						</h1>

						{actions && (
							<div className="ml-auto flex items-center gap-2">{actions}</div>
						)}
					</header>

					<main className="flex-1 px-4 py-8 md:px-6 md:py-10">
						{/* Capped and centred: full-bleed text at 2560px is unreadable, and
					    every page here is reading rather than canvas work. */}
						<div className="mx-auto w-full max-w-[1040px]">{children}</div>
					</main>
				</div>
			</div>
		</OpenReport.Provider>
	);
}
