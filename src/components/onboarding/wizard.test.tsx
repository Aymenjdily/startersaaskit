import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { isComplete, QUESTIONS } from "@/lib/onboarding";
import { NOTES_STEP, OnboardingWizard, TOTAL_STEPS } from "./wizard";

const advance = () => screen.getByRole("button", { name: /Continue|Finish/ });

/** Answers the current question with its first option, then moves on. */
async function answerStep(
	user: ReturnType<typeof userEvent.setup>,
	index: number,
) {
	const question = QUESTIONS[index];
	await user.click(
		screen.getByRole(question.multiple ? "checkbox" : "radio", {
			name: question.options[0].label,
		}),
	);
	await user.click(advance());
}

async function walkToNotes(user: ReturnType<typeof userEvent.setup>) {
	for (let index = 0; index < QUESTIONS.length; index += 1) {
		await answerStep(user, index);
	}
}

describe("OnboardingWizard", () => {
	const onFinish = () => vi.fn().mockResolvedValue(undefined);

	it("renders identical markup across separate server renders", () => {
		const wizard = <OnboardingWizard onFinish={onFinish()} />;

		expect(renderToString(wizard)).toBe(renderToString(wizard));
	});

	it("opens on the first question", () => {
		render(<OnboardingWizard onFinish={onFinish()} />);

		expect(
			screen.getByRole("heading", { name: QUESTIONS[0].prompt }),
		).toBeVisible();
		expect(screen.getByText(`Step 1 of ${TOTAL_STEPS}`)).toBeVisible();
	});

	/**
	 * A question with no stated reason gets a shrug or a lie. Every screen has
	 * to say why it is asking, so this checks the whole set rather than one.
	 */
	it("says why it is asking, on every question", () => {
		for (const question of QUESTIONS) {
			expect(question.because.length).toBeGreaterThan(10);
		}
	});

	it("will not advance until the question is answered", async () => {
		const user = userEvent.setup();
		render(<OnboardingWizard onFinish={onFinish()} />);

		expect(advance()).toBeDisabled();

		await user.click(
			screen.getByRole("radio", { name: QUESTIONS[0].options[0].label }),
		);

		expect(advance()).toBeEnabled();
	});

	it("walks every question and then offers the notes step", async () => {
		const user = userEvent.setup();
		render(<OnboardingWizard onFinish={onFinish()} />);

		await walkToNotes(user);

		expect(
			screen.getByRole("heading", { name: "Anything we should know?" }),
		).toBeVisible();
		expect(
			screen.getByText(`Step ${TOTAL_STEPS} of ${TOTAL_STEPS}`),
		).toBeVisible();
	});

	/** The last screen is the only optional one; requiring it loses the answer. */
	it("lets the notes step be finished empty", async () => {
		const user = userEvent.setup();
		const finish = onFinish();
		render(<OnboardingWizard onFinish={finish} />);

		await walkToNotes(user);

		expect(screen.getByRole("button", { name: "Finish" })).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Finish" }));

		await waitFor(() => expect(finish).toHaveBeenCalled());
		expect(finish.mock.calls[0][1]).toBe("");
	});

	it("hands back an answer for every question", async () => {
		const user = userEvent.setup();
		const finish = onFinish();
		render(<OnboardingWizard onFinish={finish} />);

		await walkToNotes(user);
		await user.type(
			screen.getByLabelText("Anything we should know?"),
			"  hi  ",
		);
		await user.click(screen.getByRole("button", { name: "Finish" }));

		await waitFor(() => expect(finish).toHaveBeenCalled());
		const [answers, notes] = finish.mock.calls[0];

		expect(isComplete(answers)).toBe(true);
		expect(notes).toBe("hi");
	});

	it("goes back without losing what was already chosen", async () => {
		const user = userEvent.setup();
		render(<OnboardingWizard onFinish={onFinish()} />);

		const chosen = QUESTIONS[0].options[1].label;
		await user.click(screen.getByRole("radio", { name: chosen }));
		await user.click(advance());
		await user.click(screen.getByRole("button", { name: "Back" }));

		expect(screen.getByRole("radio", { name: chosen })).toBeChecked();
	});

	it("has nowhere to go back to on the first step", () => {
		render(<OnboardingWizard onFinish={onFinish()} />);

		expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
	});

	it("resumes where a half-finished account left off", () => {
		render(
			<OnboardingWizard
				initialAnswers={{ [QUESTIONS[0].id]: QUESTIONS[0].options[0].id }}
				initialStep={1}
				onFinish={onFinish()}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: QUESTIONS[1].prompt }),
		).toBeVisible();
	});

	describe("a question that takes several answers", () => {
		const multi = QUESTIONS.findIndex((question) => question.multiple);

		it("exists, or the multi-select code below is unreachable", () => {
			expect(multi).toBeGreaterThan(-1);
		});

		it("keeps both choices rather than replacing the first", async () => {
			const user = userEvent.setup();
			const question = QUESTIONS[multi];
			const answers = Object.fromEntries(
				QUESTIONS.slice(0, multi).map((q) => [q.id, q.options[0].id]),
			);
			render(
				<OnboardingWizard
					initialAnswers={answers}
					initialStep={multi}
					onFinish={onFinish()}
				/>,
			);

			await user.click(
				screen.getByRole("checkbox", { name: question.options[0].label }),
			);
			await user.click(
				screen.getByRole("checkbox", { name: question.options[2].label }),
			);

			expect(
				screen.getByRole("checkbox", { name: question.options[0].label }),
			).toBeChecked();
			expect(
				screen.getByRole("checkbox", { name: question.options[2].label }),
			).toBeChecked();
		});

		it("unticks on a second click", async () => {
			const user = userEvent.setup();
			const question = QUESTIONS[multi];
			render(<OnboardingWizard initialStep={multi} onFinish={onFinish()} />);

			const box = () =>
				screen.getByRole("checkbox", { name: question.options[0].label });

			await user.click(box());
			expect(advance()).toBeEnabled();

			await user.click(box());
			expect(box()).not.toBeChecked();
			expect(advance()).toBeDisabled();
		});
	});

	it("shows what the save said when it fails", async () => {
		const user = userEvent.setup();
		const finish = vi.fn().mockRejectedValue(new Error("row-level security"));
		render(<OnboardingWizard onFinish={finish} />);

		await walkToNotes(user);
		await user.click(screen.getByRole("button", { name: "Finish" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"row-level security",
		);
	});

	it("hides the progress bar from screen readers", () => {
		const { container } = render(<OnboardingWizard onFinish={onFinish()} />);

		expect(container.querySelector(".bg-white\\/10")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
	});

	it("counts the notes step in the total", () => {
		expect(TOTAL_STEPS).toBe(QUESTIONS.length + 1);
		expect(NOTES_STEP).toBe(QUESTIONS.length);
	});
});
