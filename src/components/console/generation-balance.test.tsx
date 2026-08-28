import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FEEDBACK_REWARD, type Quota } from "@/lib/quota";
import { GenerationBalance } from "./generation-balance";

const quota = (over: Partial<Quota> = {}): Quota => ({
	used: 0,
	limit: 5,
	rewarded: false,
	...over,
});

const offer = () =>
	screen.queryByRole("button", {
		name: new RegExp(`get ${FEEDBACK_REWARD} more`, "i"),
	});

describe("GenerationBalance", () => {
	it("says nothing at all while the balance is still loading", () => {
		const { container } = render(
			<GenerationBalance onReport={vi.fn()} quota={null} />,
		);

		/* Not "0 of 0 left", which is a wrong number rather than no number. */
		expect(container).toBeEmptyDOMElement();
	});

	/**
	 * The state that sent somebody looking for a missing component.
	 *
	 * A database without `generation_limit` fails the read, and the panel used
	 * to render nothing for that — indistinguishable from still loading, from
	 * an empty balance, and from a component nobody had wired up.
	 */
	it("says why the balance is missing when the read failed", () => {
		render(
			<GenerationBalance
				error="The database is behind the app."
				onReport={vi.fn()}
				quota={null}
			/>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"The database is behind the app.",
		);
	});

	it("counts what is left, not what is spent", () => {
		render(<GenerationBalance onReport={vi.fn()} quota={quota({ used: 2 })} />);

		expect(screen.getByText("3")).toBeVisible();
		expect(screen.getByText(/of 5 generations left/)).toBeVisible();
	});

	it("counts against a raised ceiling once the reward has landed", () => {
		render(
			<GenerationBalance
				onReport={vi.fn()}
				quota={quota({ limit: 15, rewarded: true, used: 4 })}
			/>,
		);

		expect(screen.getByText("11")).toBeVisible();
		expect(screen.getByText(/of 15 generations left/)).toBeVisible();
	});

	it("never counts below zero", () => {
		/* An admin is exempt from the quota, so `used` can pass `limit`. */
		render(<GenerationBalance onReport={vi.fn()} quota={quota({ used: 9 })} />);

		expect(screen.getByText("0")).toBeVisible();
		expect(screen.queryByText("-4")).toBeNull();
	});

	describe("the offer", () => {
		/**
		 * Shown from the first visit.
		 *
		 * This used to wait until a generation had been spent. That hid it from
		 * somebody weighing up whether five was worth starting for, which is the
		 * person the extra ten is most use to.
		 */
		it("is offered before anything has been generated", () => {
			render(<GenerationBalance onReport={vi.fn()} quota={quota()} />);

			expect(offer()).toBeVisible();
		});

		it("is still offered once something has been generated", () => {
			render(
				<GenerationBalance onReport={vi.fn()} quota={quota({ used: 1 })} />,
			);

			expect(offer()).toBeVisible();
		});

		/* Once per account. Leaving it on screen invites a second report that
		   would be refused by the database with nothing to show for it. */
		it("disappears once it has been taken", () => {
			render(
				<GenerationBalance
					onReport={vi.fn()}
					quota={quota({ rewarded: true, used: 1 })}
				/>,
			);

			expect(offer()).toBeNull();
		});

		/* Taken on a fresh account too — `rewarded`, not `used`, is what ends it. */
		it("disappears once taken even with nothing generated", () => {
			render(
				<GenerationBalance
					onReport={vi.fn()}
					quota={quota({ rewarded: true })}
				/>,
			);

			expect(offer()).toBeNull();
		});

		it("opens the report dialog rather than claiming directly", async () => {
			const user = userEvent.setup();
			const onReport = vi.fn();
			render(
				<GenerationBalance onReport={onReport} quota={quota({ used: 1 })} />,
			);

			await user.click(offer() as HTMLElement);

			expect(onReport).toHaveBeenCalledOnce();
		});

		it("cannot be pressed twice while the reward is landing", () => {
			render(
				<GenerationBalance
					claiming
					onReport={vi.fn()}
					quota={quota({ used: 1 })}
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Adding them…" }),
			).toBeDisabled();
		});
	});

	it("shows a failed claim rather than leaving someone counting", () => {
		render(
			<GenerationBalance
				error="You have already claimed that one."
				onReport={vi.fn()}
				quota={quota({ used: 1 })}
			/>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"You have already claimed that one.",
		);
	});
});
