import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportDialog } from "./report-dialog";

const fileReport = vi.hoisted(() => vi.fn());

vi.mock("@/lib/feedback", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/feedback")>()),
	fileReport,
}));

function open() {
	const onClose = vi.fn();
	render(<ReportDialog onClose={onClose} open />);
	return { onClose };
}

const send = () => screen.getByRole("button", { name: /Send report/ });
const summary = () => screen.getByLabelText("In one line");

beforeEach(() => {
	fileReport.mockReset().mockResolvedValue(undefined);
});

describe("ReportDialog", () => {
	it("will not send an empty report", () => {
		open();

		expect(send()).toBeDisabled();
	});

	it("sends what was typed, with the kind chosen", async () => {
		const user = userEvent.setup();

		open();
		await user.click(screen.getByRole("button", { name: "An idea" }));
		await user.type(summary(), "A dark mode toggle");
		await user.type(
			screen.getByLabelText(/Anything else/),
			"The console is bright at night.",
		);
		await user.click(send());

		expect(fileReport).toHaveBeenCalledWith({
			kind: "idea",
			summary: "A dark mode toggle",
			detail: "The console is bright at night.",
		});
	});

	/**
	 * Someone who has just described what went wrong should not lose it to a
	 * network error. The dialog stays put and keeps the text.
	 */
	it("keeps the report on screen when sending fails", async () => {
		const user = userEvent.setup();

		fileReport.mockRejectedValue(new Error("Network is down."));

		const { onClose } = open();
		await user.type(summary(), "The download button did nothing");
		await user.click(send());

		expect(await screen.findByText("Network is down.")).toBeVisible();
		expect(summary()).toHaveValue("The download button did nothing");
		expect(onClose).not.toHaveBeenCalled();
	});

	it("confirms rather than closing silently", async () => {
		const user = userEvent.setup();

		open();
		await user.type(summary(), "The download button did nothing");
		await user.click(send());

		expect(await screen.findByText("Thank you")).toBeVisible();
	});

	/**
	 * The page and the browser are captured, never asked for — they are the two
	 * things a bug report most often gets wrong. So the form must not grow a
	 * field for either.
	 */
	it("does not ask for anything the browser already knows", () => {
		open();

		expect(
			screen.queryByLabelText(/page|url|browser/i),
		).not.toBeInTheDocument();
	});
});
