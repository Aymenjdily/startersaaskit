import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	optionsFor,
	STARTER_QUESTIONS,
	type StarterAnswers,
	type StarterQuestionId,
} from "@/lib/starter-questions";
import { CreateStarterDialog } from "./create-starter-dialog";

type User = ReturnType<typeof userEvent.setup>;

function openDialog(
	props: Partial<Parameters<typeof CreateStarterDialog>[0]> = {},
) {
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	const onClose = vi.fn();
	render(
		<CreateStarterDialog
			onClose={onClose}
			onSubmit={onSubmit}
			open
			{...props}
		/>,
	);
	return { onClose, onSubmit };
}

const advance = () =>
	screen.getByRole("button", { name: /Continue|Generate starter/ });
const pick = (user: User, label: string) =>
	user.click(screen.getByRole("radio", { name: label }));

/** Walks as far as the database question, answering everything before it. */
async function toDatabase(user: User) {
	await pick(user, "Next.js");
	await user.click(advance());
	await pick(user, "shadcn/ui");
	await user.click(advance());
}

/**
 * Answers every question and names the project.
 *
 * Derived from `STARTER_QUESTIONS` rather than a hand-written sequence of
 * clicks. The hand-written version had to be edited every time a question was
 * added — and since it was the setup for most of the tests in this file,
 * forgetting meant seven failures pointing at the project name rather than at
 * the question that had actually moved. `overrides` names the answers a test
 * cares about; everything else takes the first option on offer.
 */
async function answerAll(
	user: User,
	overrides: Partial<Record<StarterQuestionId, string>> = {},
) {
	const chosen: StarterAnswers = {};

	for (const question of STARTER_QUESTIONS) {
		if (question.kind === "text") {
			await user.type(screen.getByLabelText(question.label), "my-app");
			chosen[question.id] = "my-app";
			continue;
		}

		const options = optionsFor(question, chosen);
		const wanted = overrides[question.id];
		const option = wanted
			? options.find((candidate) => candidate.label === wanted)
			: options[0];

		if (!option) throw new Error(`no "${wanted}" for ${question.id}`);

		await pick(user, option.label);
		chosen[question.id] = option.id;
		await user.click(advance());
	}
}

/** Steps to a question by answering everything before it with the first option. */
async function toQuestion(user: User, id: StarterQuestionId) {
	const chosen: StarterAnswers = {};

	for (const question of STARTER_QUESTIONS) {
		if (question.id === id) return;

		const option = optionsFor(question, chosen)[0];

		if (!option) throw new Error(`no options for ${question.id}`);

		await pick(user, option.label);
		chosen[question.id] = option.id;
		await user.click(advance());
	}
}

/**
 * The landing question is the only one whose answer is a look rather than a
 * capability, so it is the only one that shows a picture.
 */
describe("the landing page preview", () => {
	it("is not shown on questions that have nothing to look at", () => {
		openDialog();

		expect(screen.queryByTestId("landing-preview")).not.toBeInTheDocument();
	});

	it("appears once the wizard reaches the landing question", async () => {
		const user = userEvent.setup();

		openDialog();
		await toQuestion(user, "landing");

		expect(screen.getByTestId("landing-preview")).toBeInTheDocument();
	});

	/**
	 * A placeholder rather than a dimmed copy of the real preview on "Not
	 * yet" — a grayed-out page implies a page is still coming, which is the
	 * opposite of what the answer means.
	 *
	 * The figure itself stays mounted and the same width either way.
	 * Unmounting it would collapse the dialog's width on every click between
	 * the two options, which turns a comparison into a flicker.
	 */
	it("shows a placeholder, not the page, when the answer is no", async () => {
		const user = userEvent.setup();

		openDialog();
		await toQuestion(user, "landing");
		await pick(user, "Not yet");

		expect(screen.queryByTestId("landing-preview")).not.toBeInTheDocument();
		expect(screen.getByText("No landing page")).toBeInTheDocument();
	});

	it("shows the real preview once a template is chosen", async () => {
		const user = userEvent.setup();

		openDialog();
		await toQuestion(user, "landing");
		await pick(user, "Editorial");

		expect(screen.getByTestId("landing-preview")).toBeInTheDocument();
		expect(screen.queryByText("No landing page")).not.toBeInTheDocument();
	});

	/**
	 * Gallery is a second, differently-composed page — it gets its own scale
	 * model rather than reusing Editorial's, so switching to it has to swap
	 * which preview is mounted rather than just restyling the same one.
	 */
	it("shows Gallery's own preview, not Editorial's, once Gallery is chosen", async () => {
		const user = userEvent.setup();

		openDialog();
		await toQuestion(user, "landing");
		await pick(user, "Gallery");

		expect(screen.getByTestId("gallery-landing-preview")).toBeInTheDocument();
		expect(screen.queryByTestId("landing-preview")).not.toBeInTheDocument();
		expect(screen.queryByText("No landing page")).not.toBeInTheDocument();
	});

	/** It is decoration beside the real control, so it must not be announced. */
	it("is hidden from assistive technology", async () => {
		const user = userEvent.setup();

		openDialog();
		await toQuestion(user, "landing");

		expect(screen.getByTestId("landing-preview")).toHaveAttribute(
			"aria-hidden",
			"true",
		);
	});
});

describe("CreateStarterDialog", () => {
	it("opens on the first question", () => {
		openDialog();

		expect(
			screen.getByRole("dialog", { name: STARTER_QUESTIONS[0].prompt }),
		).toBeVisible();
		expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
			`Question 1 of ${STARTER_QUESTIONS.length}`,
		);
	});

	it("will not advance until the question is answered", async () => {
		const user = userEvent.setup();
		openDialog();

		expect(advance()).toBeDisabled();
		await pick(user, "Next.js");

		expect(advance()).toBeEnabled();
	});

	it("has nowhere to go back to on the first question", () => {
		openDialog();

		expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
	});

	it("keeps an answer when stepping back to it", async () => {
		const user = userEvent.setup();
		openDialog();

		await pick(user, "TanStack Start");
		await user.click(advance());
		await user.click(screen.getByRole("button", { name: "Back" }));

		expect(screen.getByRole("radio", { name: "TanStack Start" })).toBeChecked();
	});

	describe("the pairing the landing page promises never to offer", () => {
		it("hides Supabase Auth when the database is Neon", async () => {
			const user = userEvent.setup();
			openDialog();

			await toDatabase(user);
			await pick(user, "Neon");
			await user.click(advance());
			await pick(user, "Drizzle");
			await user.click(advance());

			expect(screen.getByRole("radio", { name: "Better Auth" })).toBeVisible();
			expect(screen.queryByRole("radio", { name: "Supabase Auth" })).toBeNull();
		});

		it("offers it when the database is Supabase", async () => {
			const user = userEvent.setup();
			openDialog();

			await toDatabase(user);
			await pick(user, "Supabase");
			await user.click(advance());
			await pick(user, "Drizzle");
			await user.click(advance());

			expect(
				screen.getByRole("radio", { name: "Supabase Auth" }),
			).toBeVisible();
		});

		/**
		 * Choosing Supabase, then Supabase Auth, then going back and switching to
		 * Neon leaves an answer that is no longer on offer. Invisible on screen,
		 * still in the payload — so it has to be dropped, and the step it belongs
		 * to has to stop counting as answered.
		 */
		it("drops an answer that the new database rules out", async () => {
			const user = userEvent.setup();
			openDialog();

			await toDatabase(user);
			await pick(user, "Supabase");
			await user.click(advance());
			await pick(user, "Drizzle");
			await user.click(advance());
			await pick(user, "Supabase Auth");

			await user.click(screen.getByRole("button", { name: "Back" }));
			await user.click(screen.getByRole("button", { name: "Back" }));
			await pick(user, "Neon");
			await user.click(advance());
			await user.click(advance());

			expect(screen.queryByRole("radio", { name: "Supabase Auth" })).toBeNull();
			expect(
				screen.getByRole("radio", { name: "Better Auth" }),
			).not.toBeChecked();
			expect(advance()).toBeDisabled();
		});
	});

	describe("choosing MongoDB", () => {
		async function toOrmStep(user: User, database: string) {
			await toDatabase(user);
			await pick(user, database);
			await user.click(advance());
		}

		it("offers Mongoose instead of Drizzle", async () => {
			const user = userEvent.setup();
			openDialog();

			await toOrmStep(user, "MongoDB");

			expect(screen.getByRole("radio", { name: "Mongoose" })).toBeVisible();
			expect(screen.getByRole("radio", { name: "Prisma" })).toBeVisible();
			expect(screen.queryByRole("radio", { name: "Drizzle" })).toBeNull();
		});

		it("offers Drizzle instead of Mongoose for a SQL host", async () => {
			const user = userEvent.setup();
			openDialog();

			await toOrmStep(user, "Turso");

			expect(screen.getByRole("radio", { name: "Drizzle" })).toBeVisible();
			expect(screen.queryByRole("radio", { name: "Mongoose" })).toBeNull();
		});

		/** The same stranding problem as auth, one question earlier. */
		it("drops Mongoose when the database moves back to SQL", async () => {
			const user = userEvent.setup();
			openDialog();

			await toOrmStep(user, "MongoDB");
			await pick(user, "Mongoose");
			await user.click(screen.getByRole("button", { name: "Back" }));
			await pick(user, "PlanetScale");
			await user.click(advance());

			expect(screen.queryByRole("radio", { name: "Mongoose" })).toBeNull();
			expect(screen.getByRole("radio", { name: "Drizzle" })).not.toBeChecked();
			expect(advance()).toBeDisabled();
		});
	});

	describe("the project name", () => {
		it("refuses a name that would not make a repository", async () => {
			const user = userEvent.setup();
			openDialog();
			await answerAll(user);

			await user.clear(screen.getByLabelText("Project"));
			await user.type(screen.getByLabelText("Project"), "My App");

			expect(screen.getByLabelText("Project")).toHaveAttribute(
				"aria-invalid",
				"true",
			);
			expect(advance()).toBeDisabled();
		});

		/** Complaining before anything has been typed is just nagging. */
		it("says nothing before anything is typed", async () => {
			const user = userEvent.setup();
			openDialog();
			await answerAll(user);
			await user.clear(screen.getByLabelText("Project"));

			expect(screen.getByLabelText("Project")).toHaveAttribute(
				"aria-invalid",
				"false",
			);
		});
	});

	/**
	 * Losing the answers to a stray click.
	 *
	 * Reported from production: someone answering the wizard clicked slightly
	 * outside the panel and lost every answer and their place in the sequence.
	 * Two separate defects made that possible — the backdrop dismissed on a
	 * single mousedown, and closing wiped the draft — and either one alone
	 * would have been survivable.
	 */
	describe("not losing the draft to a mis-aimed click", () => {
		const backdrop = () =>
			document.querySelector('[aria-hidden="true"].fixed') as Element;

		it("ignores the backdrop once an answer has been given", async () => {
			const user = userEvent.setup();
			const { onClose } = openDialog();

			await pick(user, "Next.js");
			fireEvent.mouseDown(backdrop());

			expect(onClose).not.toHaveBeenCalled();
			expect(screen.getByRole("radio", { name: "Next.js" })).toBeChecked();
		});

		it("ignores the backdrop once past the first question", async () => {
			const user = userEvent.setup();
			const { onClose } = openDialog();

			await pick(user, "Next.js");
			await user.click(advance());
			fireEvent.mouseDown(backdrop());

			expect(onClose).not.toHaveBeenCalled();
		});

		/* Nothing has been entered, so there is nothing to protect and the
		   dialog should behave like any other. */
		it("still dismisses on the backdrop before anything is answered", () => {
			const { onClose } = openDialog();

			fireEvent.mouseDown(backdrop());

			expect(onClose).toHaveBeenCalled();
		});

		/* Escape and the close button are deliberate, so they keep working —
		   a modal that cannot be dismissed from the keyboard is a trap. */
		it("can still be closed on purpose", async () => {
			const user = userEvent.setup();
			const { onClose } = openDialog();

			await pick(user, "Next.js");
			await user.click(screen.getByRole("button", { name: "Close" }));

			expect(onClose).toHaveBeenCalled();
		});

		it("resumes where it was when reopened", async () => {
			const user = userEvent.setup();
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onClose = vi.fn();
			const view = render(
				<CreateStarterDialog onClose={onClose} onSubmit={onSubmit} open />,
			);

			await pick(user, "Next.js");
			await user.click(advance());
			await user.click(screen.getByRole("button", { name: "Close" }));

			view.rerender(
				<CreateStarterDialog
					onClose={onClose}
					onSubmit={onSubmit}
					open={false}
				/>,
			);
			view.rerender(
				<CreateStarterDialog onClose={onClose} onSubmit={onSubmit} open />,
			);

			/* Same question, not back at the start. */
			expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
				`Question 2 of ${STARTER_QUESTIONS.length}`,
			);
			await user.click(screen.getByRole("button", { name: "Back" }));
			expect(screen.getByRole("radio", { name: "Next.js" })).toBeChecked();
		});

		/* The one point where starting over is right: it has been delivered. */
		it("starts fresh after a starter has been generated", async () => {
			const user = userEvent.setup();
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onClose = vi.fn();
			const view = render(
				<CreateStarterDialog onClose={onClose} onSubmit={onSubmit} open />,
			);

			await answerAll(user);
			await user.click(
				screen.getByRole("button", { name: "Generate starter" }),
			);

			view.rerender(
				<CreateStarterDialog
					onClose={onClose}
					onSubmit={onSubmit}
					open={false}
				/>,
			);
			view.rerender(
				<CreateStarterDialog onClose={onClose} onSubmit={onSubmit} open />,
			);

			expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
				`Question 1 of ${STARTER_QUESTIONS.length}`,
			);
		});
	});

	describe("delivering", () => {
		/**
		 * Seven answers is a lot to retype. A failed download has to leave every
		 * one of them where it was, or a flaky network costs someone the whole
		 * flow.
		 */
		it("keeps the answers and says what went wrong when delivery fails", async () => {
			const user = userEvent.setup();
			const onSubmit = vi
				.fn()
				.mockRejectedValue(new Error("You need to be signed in."));
			const { onClose } = openDialog({ onSubmit });

			await answerAll(user);
			await user.click(
				screen.getByRole("button", { name: "Generate starter" }),
			);

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"You need to be signed in.",
			);
			expect(onClose).not.toHaveBeenCalled();
			expect(screen.getByLabelText("Project")).toHaveValue("my-app");
		});

		it("can be retried after a failure", async () => {
			const user = userEvent.setup();
			const onSubmit = vi
				.fn()
				.mockRejectedValueOnce(new Error("Network is down."))
				.mockResolvedValueOnce(undefined);
			openDialog({ onSubmit });

			await answerAll(user);
			const button = () =>
				screen.getByRole("button", { name: /Generate starter|Generating/ });
			await user.click(button());
			expect(await screen.findByRole("alert")).toBeVisible();

			await user.click(button());

			expect(onSubmit).toHaveBeenCalledTimes(2);
		});

		it("closes once the starter has been delivered", async () => {
			const user = userEvent.setup();
			const { onClose } = openDialog();

			await answerAll(user);
			await user.click(
				screen.getByRole("button", { name: "Generate starter" }),
			);

			expect(onClose).toHaveBeenCalled();
		});

		/** Two clicks would generate and download the same zip twice. */
		it("cannot be submitted twice while it is working", async () => {
			const user = userEvent.setup();
			let release: () => void = () => {};
			const onSubmit = vi.fn(
				() =>
					new Promise<void>((resolve) => {
						release = resolve;
					}),
			);
			openDialog({ onSubmit });

			await answerAll(user);
			await user.click(
				screen.getByRole("button", { name: "Generate starter" }),
			);

			expect(
				screen.getByRole("button", { name: "Generating…" }),
			).toBeDisabled();

			release();
		});
	});

	/**
	 * Spelled out rather than derived, unlike the walk that produces it: this
	 * is the one assertion that should fail loudly when a question is added,
	 * because the payload is what the generator is handed.
	 */
	it("hands over a full set of answers at the end", async () => {
		const user = userEvent.setup();
		const { onSubmit } = openDialog();

		await answerAll(user);
		await user.click(screen.getByRole("button", { name: "Generate starter" }));

		expect(onSubmit).toHaveBeenCalledWith({
			framework: "nextjs",
			components: "shadcn",
			database: "neon",
			orm: "drizzle",
			auth: "better_auth",
			billing: "stripe",
			email: "resend",
			packageManager: "npm",
			landing: "editorial",
			project: "my-app",
		});
	});

	/**
	 * This used to assert the opposite — that closing forgot everything — on the
	 * grounds that reopening should not resume "someone else's" half-finished
	 * answers. That risk is not real: the draft is component state in one
	 * person's browser, not anything shared or persisted, so there is nobody
	 * else whose answers could be shown.
	 *
	 * What the rule cost was real. Discarding on close meant a single mousedown
	 * on the backdrop destroyed seven answers, and that is what happened to
	 * somebody. Resuming a draft is recoverable — Back reaches every answer.
	 * Losing one is not.
	 */
	it("keeps the draft when closed rather than discarding it", async () => {
		const user = userEvent.setup();
		const { onClose } = openDialog();

		await pick(user, "TanStack Start");
		await user.click(advance());
		await user.click(screen.getByRole("button", { name: "Close" }));

		expect(onClose).toHaveBeenCalledOnce();
		/* Still on the question it was left on, with the answer intact. */
		expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
			`Question 2 of ${STARTER_QUESTIONS.length}`,
		);
		await user.click(screen.getByRole("button", { name: "Back" }));
		expect(screen.getByRole("radio", { name: "TanStack Start" })).toBeChecked();
	});
});
