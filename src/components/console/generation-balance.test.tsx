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
	it("says nothing at all until the balance is known", () => {
		const { container } = render(
			<GenerationBalance onReport={vi.fn()} quota={null} />,
		);

		/* Not "0 of 0 left", which is a wrong number rather than no number. */
		expect(container).toBeEmptyDOMElement();
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
		/* Nothing has been generated, so there is nothing to report on, and
		   asking for feedback first reads as a toll rather than a trade. */
		it("stays hidden until a generation has been spent", () => {
			render(<GenerationBalance onReport={vi.fn()} quota={quota()} />);

			expect(offer()).toBeNull();
		});

		it("appears once something has been generated", () => {
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
