import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminBoard } from "@/components/console/admin-board";
import { ConsoleShell } from "@/components/console/console-shell";
import { isAdmin } from "@/lib/feedback";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
	head: () =>
		pageHead({
			path: "/admin",
			title: "Admin",
			description: "Accounts and reported problems.",
			noIndex: true,
		}),
	component: Admin,
});

/**
 * Users and reports, for whoever is in the `admins` table.
 *
 * ## The check here is not the lock
 *
 * It decides what to *draw*. What actually keeps the data private is row level
 * security: `bug_reports` admits non-admins only to their own rows, and the
 * user list comes from `admin_user_rows()`, which raises for anyone else. A
 * visitor who types `/admin` reaches this page and finds two empty panels and
 * an error — not somebody else's data — and that is the property worth having,
 * because a route guard in a client bundle is a suggestion.
 *
 * It exists anyway because "nothing here" is a better answer than a wall of
 * permission errors for the ninety-nine percent who arrive by accident.
 */
function Admin() {
	const [allowed, setAllowed] = useState<boolean | null>(null);

	useEffect(() => {
		isAdmin().then(setAllowed);
	}, []);

	return (
		<ConsoleShell currentPath="/admin" title="Admin">
			{allowed === false ? (
				<p className="text-[14px] text-ink-muted">
					This page is for accounts with an admin role.
				</p>
			) : (
				<AdminBoard ready={allowed === true} />
			)}
		</ConsoleShell>
	);
}
