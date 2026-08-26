import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./dialog";

function open(props: Partial<Parameters<typeof Dialog>[0]> = {}) {
	return render(
		<Dialog onClose={vi.fn()} open title="Create something" {...props}>
			<button type="button">Inside first</button>
			<button type="button">Inside last</button>
		</Dialog>,
	);
}

/** The realistic arrangement: a trigger on the page that opens the dialog. */
function Harness() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button onClick={() => setIsOpen(true)} type="button">
				Open it
			</button>
			<Dialog onClose={() => setIsOpen(false)} open={isOpen} title="A dialog">
				<button type="button">Inside</button>
			</Dialog>
		</>
	);
}

describe("Dialog", () => {
	describe("when closed", () => {
		it("renders nothing at all", () => {
			render(
				<Dialog onClose={vi.fn()} open={false} title="Hidden">
					<button type="button">Inside</button>
				</Dialog>,
			);

			expect(screen.queryByRole("dialog")).toBeNull();
			expect(screen.queryByText("Inside")).toBeNull();
		});

		/** Closed by default means the server and the client agree on nothing. */
		it("stays out of the server render", () => {
			const markup = renderToString(
				<Dialog onClose={vi.fn()} open={false} title="Hidden">
					<button type="button">Inside</button>
				</Dialog>,
			);

			expect(markup).toBe("");
		});
	});

	describe("when open", () => {
		it("is a modal dialog named by its title", () => {
			open();

			const dialog = screen.getByRole("dialog", { name: "Create something" });
			expect(dialog).toHaveAttribute("aria-modal", "true");
		});

		it("is described by its description when it has one", () => {
			open({ description: "Question 1 of 6" });

			expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
				"Question 1 of 6",
			);
		});

		it("shows what it was given", () => {
			open();

			expect(screen.getByText("Inside first")).toBeVisible();
		});

		/** A dialog that leaves the page scrolling behind it is a popover. */
		it("stops the page behind it scrolling", () => {
			open();

			expect(document.body.style.overflow).toBe("hidden");
		});
	});

	describe("closing", () => {
		it("closes on the close button", async () => {
			const user = userEvent.setup();
			const onClose = vi.fn();
			open({ onClose });

			await user.click(screen.getByRole("button", { name: "Close" }));

			expect(onClose).toHaveBeenCalledOnce();
		});

		it("closes on Escape", async () => {
			const user = userEvent.setup();
			const onClose = vi.fn();
			open({ onClose });

			await user.keyboard("{Escape}");

			expect(onClose).toHaveBeenCalledOnce();
		});

		it("closes on a click outside the panel", () => {
			const onClose = vi.fn();
			const { container } = open({ onClose });

			const backdrop = container.querySelector('[aria-hidden="true"]');
			fireEvent.mouseDown(backdrop as Element);

			expect(onClose).toHaveBeenCalledOnce();
		});

		/**
		 * `mousedown` rather than `click`: selecting text inside the panel and
		 * releasing the button outside it fires a click on the backdrop, and
		 * dismissing someone's work because they dragged is a bad trade.
		 */
		it("does not close on a click that started inside the panel", () => {
			const onClose = vi.fn();
			const { container } = open({ onClose });

			fireEvent.mouseDown(screen.getByText("Inside first"));
			fireEvent.click(
				container.querySelector('[aria-hidden="true"]') as Element,
			);

			expect(onClose).not.toHaveBeenCalled();
		});

		it("lets the page scroll again afterwards", () => {
			const { rerender } = open();
			expect(document.body.style.overflow).toBe("hidden");

			rerender(
				<Dialog onClose={vi.fn()} open={false} title="Create something">
					<button type="button">Inside first</button>
				</Dialog>,
			);

			expect(document.body.style.overflow).not.toBe("hidden");
		});
	});

	describe("focus", () => {
		it("moves into the panel on open", () => {
			open();

			expect(screen.getByText("Inside first")).toHaveFocus();
		});

		/** Otherwise the reader is dumped at the top of the page they left. */
		it("returns to whatever opened it", async () => {
			const user = userEvent.setup();
			render(<Harness />);
			const trigger = screen.getByRole("button", { name: "Open it" });

			await user.click(trigger);
			expect(screen.getByText("Inside")).toHaveFocus();

			await user.keyboard("{Escape}");

			expect(trigger).toHaveFocus();
		});

		/**
		 * Close is deliberately the last stop, not the first: the question the
		 * reader opened the dialog to answer should not sit behind a dismiss
		 * button in the tab order.
		 */
		it("puts Close after the content rather than before it", async () => {
			const user = userEvent.setup();
			open();

			await user.tab();
			expect(screen.getByText("Inside last")).toHaveFocus();

			await user.tab();
			expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
		});

		it("wraps from the last control back to the first", async () => {
			const user = userEvent.setup();
			open();

			screen.getByRole("button", { name: "Close" }).focus();
			await user.tab();

			expect(screen.getByText("Inside first")).toHaveFocus();
		});

		it("wraps backwards from the first control to the last", async () => {
			const user = userEvent.setup();
			open();

			screen.getByText("Inside first").focus();
			await user.tab({ shift: true });

			expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
		});
	});
});
