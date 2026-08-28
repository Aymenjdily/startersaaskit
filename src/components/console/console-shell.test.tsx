import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConsoleShell, useOpenReport } from "./console-shell";

/**
 * The shell's report dialog, and who can open it.
 *
 * `GenerationBalance` has a button that opens this dialog, and its own tests
 * pass the callback in directly — so they went on passing while the real
 * callback was a no-op. The page was calling `useOpenReport` in the component
 * that *renders* `ConsoleShell`, which sits above the provider inside it, and
 * got the context default. Clicking did nothing, silently, in production.
 *
 * These render the real composition rather than the pieces.
 */

vi.mock("@/lib/supabase", () => ({
	getSupabase: () => ({
		auth: {
			getUser: async () => ({
				data: { user: { email: "someone@example.com", id: "u1" } },
			}),
			signOut: async () => undefined,
		},
	}),
}));

vi.mock("@/lib/feedback", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/feedback")>()),
	isAdmin: async () => false,
}));

/** A child that asks the shell to open the dialog, exactly as the page does. */
function ChildWithButton() {
	const openReport = useOpenReport();

	return (
		<button onClick={() => openReport("feedback")} type="button">
			Leave feedback
		</button>
	);
}

const dialog = (name: string) => screen.queryByRole("dialog", { name });

describe("the console shell's report dialog", () => {
	it("starts closed", async () => {
		render(
			<ConsoleShell currentPath="/starters" title="Starters">
				<ChildWithButton />
			</ConsoleShell>,
		);

		await screen.findByRole("button", { name: "Leave feedback" });

		expect(dialog("Leave feedback")).toBeNull();
		expect(dialog("Report a problem")).toBeNull();
	});

	/**
	 * The regression. A child of the shell must reach the real opener, not the
	 * context default — the difference is invisible until somebody clicks.
	 */
	it("opens when a child of the shell asks it to", async () => {
		const user = userEvent.setup();
		render(
			<ConsoleShell currentPath="/starters" title="Starters">
				<ChildWithButton />
			</ConsoleShell>,
		);

		await user.click(
			await screen.findByRole("button", { name: "Leave feedback" }),
		);

		/* Titled for what was asked for. A dialog headed "Report a problem" is
		   the wrong question to put to somebody who was offered generations for
		   an opinion. */
		await waitFor(() => expect(dialog("Leave feedback")).toBeVisible());
	});

	it("still opens from the rail's own button", async () => {
		const user = userEvent.setup();
		render(
			<ConsoleShell currentPath="/starters" title="Starters">
				<ChildWithButton />
			</ConsoleShell>,
		);

		await user.click(await screen.findByRole("button", { name: /report/i }));

		await waitFor(() => expect(dialog("Report a problem")).toBeVisible());
	});
});
