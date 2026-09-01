import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StarterRecord } from "@/lib/generate/starters";
import {
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";
import { StackMarks } from "./stack-marks";

const answers: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "neon",
	orm: "drizzle",
	auth: "better_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
};

const record: StarterRecord = {
	id: "my-app",
	project: "my-app",
	answers: { ...answers, project: "my-app" },
	created_at: "2026-01-15T10:00:00Z",
};

/** What `StackMarks` actually renders a mark for: a choice question the record answered with an option that carries a logo. */
const expectedLabels = STARTER_QUESTIONS.filter(
	(question) => question.kind === "choice",
)
	.map((question) =>
		question.options?.find(
			(option) => option.id === answers[question.id as keyof StarterAnswers],
		),
	)
	.filter((option) => option?.icon)
	.map((option) => option?.label as string);

describe("StackMarks", () => {
	/**
	 * The native `title` used to be the only place the name lived, and it is
	 * slow and easy to miss on a small gray icon. It stays as the accessible
	 * and keyboard fallback; the bubble beside it is what makes the name
	 * actually noticeable on hover.
	 */
	it("keeps the accessible name on the tile itself", () => {
		const { container } = render(<StackMarks record={record} />);

		for (const label of expectedLabels) {
			expect(container.querySelector(`[title="${label}"]`)).not.toBeNull();
		}
	});

	it("prints the same name in a visible tooltip bubble", () => {
		render(<StackMarks record={record} />);

		for (const label of expectedLabels) {
			expect(screen.getByText(label)).toBeInTheDocument();
		}
	});

	/**
	 * The bubble repeats what `title` already says, so a screen reader that
	 * somehow reads both must not hear the name twice.
	 */
	it("hides the bubble from assistive technology", () => {
		render(<StackMarks record={record} />);

		for (const label of expectedLabels) {
			expect(screen.getByText(label)).toHaveAttribute("aria-hidden", "true");
		}
	});

	it("renders one tile per answered choice with a mark", () => {
		const { container } = render(<StackMarks record={record} />);

		expect(container.querySelectorAll(".group\\/mark")).toHaveLength(
			expectedLabels.length,
		);
	});
});
