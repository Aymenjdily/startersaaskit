import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBoard } from "./admin-board";

const listUsers = vi.hoisted(() => vi.fn());
const listReports = vi.hoisted(() => vi.fn());
const setReportStatus = vi.hoisted(() => vi.fn());

vi.mock("@/lib/feedback", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/feedback")>()),
	listUsers,
	listReports,
	setReportStatus,
}));

const ADA = {
	id: "u1",
	email: "ada@example.com",
	display_name: "Ada Lovelace",
	role: "solo_founder",
	created_at: "2026-01-04T10:00:00Z",
	last_sign_in_at: "2026-02-01T10:00:00Z",
	onboarded_at: "2026-01-04T10:30:00Z",
	starters: 3,
};

const REPORT = {
	id: "b1",
	user_id: "u1",
	kind: "bug" as const,
	summary: "The download button did nothing",
	detail: "Clicked it twice.",
	path: "/starters",
	user_agent: "Firefox",
	status: "open" as const,
	created_at: "2026-02-02T09:00:00Z",
};

beforeEach(() => {
	listUsers.mockReset().mockResolvedValue([ADA]);
	listReports.mockReset().mockResolvedValue([REPORT]);
	setReportStatus.mockReset().mockResolvedValue(undefined);
});

const tab = (name: string) => screen.getByRole("tab", { name });

describe("AdminBoard", () => {
	it("opens on the users tab", async () => {
		render(<AdminBoard ready />);

		expect(await screen.findByText("ada@example.com")).toBeVisible();
		expect(tab("Users")).toHaveAttribute("aria-selected", "true");
	});

	it("counts the starters an account has generated", async () => {
		render(<AdminBoard ready />);

		expect(await screen.findByText("3")).toBeVisible();
	});

	it("shows the reports on the bugs tab", async () => {
		const user = userEvent.setup();

		render(<AdminBoard ready />);
		await user.click(tab("Bugs"));

		expect(
			await screen.findByText("The download button did nothing"),
		).toBeVisible();
		/* The page is captured with the report, which is the point of capturing
		   it — an admin should not have to ask where it happened. */
		expect(screen.getByText("/starters")).toBeVisible();
	});

	it("moves a report along", async () => {
		const user = userEvent.setup();

		render(<AdminBoard ready />);
		await user.click(tab("Bugs"));
		await user.selectOptions(
			await screen.findByLabelText(/Status for/),
			"fixed",
		);

		expect(setReportStatus).toHaveBeenCalledWith("b1", "fixed");
	});

	/**
	 * The user list joins three tables and counts starters. Paying for it behind
	 * a tab nobody opened is how an admin page becomes slow for no reason.
	 */
	it("does not load a panel until its tab is opened", async () => {
		const user = userEvent.setup();

		render(<AdminBoard ready />);
		await screen.findByText("ada@example.com");

		expect(listReports).not.toHaveBeenCalled();

		await user.click(tab("Bugs"));
		await screen.findByText("The download button did nothing");

		expect(listReports).toHaveBeenCalled();
	});

	/**
	 * `ready` is false while the admin check is in flight. Loading then would
	 * fire a request that is certain to be refused, and show its error.
	 */
	it("waits for the permission check before asking for anything", () => {
		render(<AdminBoard ready={false} />);

		expect(listUsers).not.toHaveBeenCalled();
		expect(screen.getByText("Loading…")).toBeVisible();
	});

	it("says so when a panel cannot load", async () => {
		listUsers.mockRejectedValue(new Error("not authorised"));

		render(<AdminBoard ready />);

		expect(await screen.findByText("not authorised")).toBeVisible();
	});
});
