import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_MIN, RATING_LABELS } from "@/lib/product-feedback";
import { FEEDBACK_REWARD } from "@/lib/quota";
import { FeedbackDialog } from "./feedback-dialog";

const leaveFeedback = vi.hoisted(() => vi.fn());

vi.mock("@/lib/product-feedback", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/product-feedback")>()),
	leaveFeedback,
}));

beforeEach(() => {
	leaveFeedback.mockReset();
	leaveFeedback.mockResolvedValue(undefined);
});

const open = (props: Partial<Parameters<typeof FeedbackDialog>[0]> = {}) => {
	const onClose = vi.fn();
	const onSent = vi.fn();
	render(<FeedbackDialog onClose={onClose} onSent={onSent} open {...props} />);
	return { onClose, onSent };
};

const send = () => screen.getByRole("button", { name: /Send and get|Sending/ });
const rate = (user: ReturnType<typeof userEvent.setup>, label: string) =>
	user.click(screen.getByRole("button", { name: label }));

const ENOUGH = "x".repeat(MESSAGE_MIN + 5);

describe("FeedbackDialog", () => {
	it("asks its own question rather than the bug report's", () => {
		open();

		expect(
			screen.getByRole("dialog", { name: "How is it going?" }),
		).toBeVisible();
		/* The thing that made the old version wrong. */
		expect(screen.queryByText("What is it?")).toBeNull();
	});

	it("says up front what sending it is worth", () => {
		open();

		expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
			new RegExp(`${FEEDBACK_REWARD} generations`),
		);
	});

	describe("what it will not send", () => {
		it("will not send with nothing filled in", () => {
			open();

			expect(send()).toBeDisabled();
		});

		/* The rating is the only field anything can be counted over, so a scale
		   nobody is made to answer produces a column of nulls. */
		it("will not send an opinion with no rating", async () => {
			const user = userEvent.setup();
			open();

			await user.type(
				screen.getByLabelText(/What would make it better/),
				ENOUGH,
			);

			expect(send()).toBeDisabled();
		});

		it("will not send a rating with no opinion", async () => {
			const user = userEvent.setup();
			open();

			await rate(user, RATING_LABELS[5]);

			expect(send()).toBeDisabled();
		});

		it("says why a too-short message is not enough", async () => {
			const user = userEvent.setup();
			open();

			await user.type(screen.getByLabelText(/What would make it better/), "no");

			expect(
				screen.getByText(new RegExp(`at least ${MESSAGE_MIN} characters`)),
			).toBeVisible();
		});
	});

	it("sends the rating, the message and what they are building", async () => {
		const user = userEvent.setup();
		open();

		await rate(user, RATING_LABELS[4]);
		await user.type(screen.getByLabelText(/What would make it better/), ENOUGH);
		await user.type(
			screen.getByLabelText(/What are you building/),
			"A booking tool",
		);
		await user.click(send());

		expect(leaveFeedback).toHaveBeenCalledWith({
			building: "A booking tool",
			message: ENOUGH,
			rating: 4,
		});
	});

	/* Optional, and the most useful answer — so it must not become required by
	   accident. */
	it("sends without what they are building", async () => {
		const user = userEvent.setup();
		open();

		await rate(user, RATING_LABELS[1]);
		await user.type(screen.getByLabelText(/What would make it better/), ENOUGH);

		expect(send()).toBeEnabled();
		await user.click(send());

		expect(leaveFeedback).toHaveBeenCalledOnce();
	});

	/**
	 * The reward hangs off this. Firing on the click would pay for a failed
	 * insert; firing on close would pay for opening the dialog.
	 */
	it("reports back only once the row is written", async () => {
		const user = userEvent.setup();
		const { onSent } = open();

		await rate(user, RATING_LABELS[3]);
		await user.type(screen.getByLabelText(/What would make it better/), ENOUGH);
		await user.click(send());

		expect(onSent).toHaveBeenCalledOnce();
		expect(
			await screen.findByText(/generations are on your account/),
		).toBeVisible();
	});

	it("does not report back, or clear anything, when the send fails", async () => {
		const user = userEvent.setup();
		leaveFeedback.mockRejectedValue(new Error("Network is down."));
		const { onClose, onSent } = open();

		await rate(user, RATING_LABELS[2]);
		await user.type(screen.getByLabelText(/What would make it better/), ENOUGH);
		await user.click(send());

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Network is down.",
		);
		expect(onSent).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
		/* Retryable without retyping. */
		expect(screen.getByLabelText(/What would make it better/)).toHaveValue(
			ENOUGH,
		);
	});

	/* Same reasoning as the generator wizard: a mis-aimed click should not end
	   something somebody has typed into. */
	it("does not let the backdrop discard a written opinion", async () => {
		const user = userEvent.setup();
		const { onClose } = open();

		await user.type(screen.getByLabelText(/What would make it better/), ENOUGH);
		const backdrop = document.querySelector(
			'[aria-hidden="true"].fixed',
		) as Element;
		backdrop.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

		expect(onClose).not.toHaveBeenCalled();
	});
});
