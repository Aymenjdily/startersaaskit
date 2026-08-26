import { useState } from "react";
import { FormError } from "@/components/auth/controls";
import { LandingPreview } from "@/components/starters/landing-preview";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { OptionCards } from "@/components/ui/option-cards";
import {
	isProjectNameValid,
	isStarterAnswered,
	optionsFor,
	pruneAnswers,
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

/**
 * The generator's questions, one screen at a time.
 *
 * The dialog collects and validates; `onSubmit` delivers. It stays open on a
 * failure with every answer intact, because the alternative is asking someone
 * to retype seven choices to retry a network error.
 *
 * The final button says "Generate starter", not "Create repository": what
 * arrives is a zip. Nothing here touches anyone's GitHub account.
 */
export function CreateStarterDialog({
	onClose,
	onSubmit,
	open,
}: {
	onClose: () => void;
	/** Resolves once the starter has been delivered; rejects with what went wrong. */
	onSubmit: (answers: StarterAnswers) => Promise<void>;
	open: boolean;
}) {
	const [answers, setAnswers] = useState<StarterAnswers>({});
	const [step, setStep] = useState(0);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const question = STARTER_QUESTIONS[step];
	const last = step === STARTER_QUESTIONS.length - 1;
	const ready = isStarterAnswered(question, answers);
	const projectName = answers.project ?? "";
	/* Only complain once there is something to complain about. */
	const nameLooksWrong = projectName !== "" && !isProjectNameValid(projectName);

	function answer(value: string | string[]) {
		const chosen = Array.isArray(value) ? value[0] : value;

		setError(null);
		/* Changing the database can strip an auth answer that depended on it. */
		setAnswers(pruneAnswers({ ...answers, [question.id]: chosen }));
	}

	function close() {
		setAnswers({});
		setStep(0);
		setError(null);
		onClose();
	}

	async function next() {
		setError(null);

		if (!last) {
			setStep(step + 1);
			return;
		}

		setBusy(true);
		try {
			await onSubmit(answers);
			/* Only cleared on success. A failed download should leave the answers
			   exactly where they were so it can be retried. */
			close();
		} catch (thrown) {
			setError(
				thrown instanceof Error
					? thrown.message
					: "Could not generate that starter.",
			);
		} finally {
			setBusy(false);
		}
	}

	/**
	 * The landing question is the only one whose answer is a *look*, so it is
	 * the only one that gets a picture. Widening the dialog for that one step
	 * rather than for all of them keeps every other question the size it wants
	 * to be — a two-option question in an 880px box reads as a mistake.
	 */
	const showsPreview = question.id === "landing";

	return (
		<Dialog
			className={showsPreview ? "max-w-[900px]" : undefined}
			description={`Question ${step + 1} of ${STARTER_QUESTIONS.length}`}
			onClose={close}
			open={open}
			title={question.prompt}
		>
			<div className="flex flex-col gap-6">
				<div aria-hidden="true" className="h-1 rounded-full bg-white/10">
					<div
						className="h-full rounded-full bg-brand transition-[width] duration-300"
						style={{
							width: `${((step + 1) / STARTER_QUESTIONS.length) * 100}%`,
						}}
					/>
				</div>

				{question.kind === "text" ? (
					<div className="flex flex-col gap-1.5">
						<label
							className="text-[13px] font-medium text-ink"
							htmlFor="starter-project"
						>
							{question.label}
						</label>
						<input
							aria-describedby="starter-project-hint"
							aria-invalid={nameLooksWrong}
							autoComplete="off"
							className="h-11 w-full rounded-[8px] border border-white/12 bg-black/25 px-3 text-[14px] text-ink transition-colors duration-200 placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
							id="starter-project"
							onChange={(event) => answer(event.target.value)}
							placeholder={question.placeholder}
							value={projectName}
						/>
						<p
							className={cn(
								"text-[12px]",
								nameLooksWrong ? "text-diagram-red" : "text-ink-muted",
							)}
							id="starter-project-hint"
						>
							{question.hint}
						</p>
					</div>
				) : (
					<div
						className={cn(
							"flex flex-col gap-6",
							showsPreview && "md:flex-row md:items-start",
						)}
					>
						<div className="flex min-w-0 flex-1 flex-col gap-3">
							<OptionCards
								name={question.id}
								onChange={answer}
								options={optionsFor(question, answers)}
								value={answers[question.id]}
							/>
							{question.hint && (
								<p className="text-[12px] text-ink-muted">{question.hint}</p>
							)}
						</div>

						{showsPreview && (
							/**
							 * Shown whichever option is selected, and dimmed when the
							 * answer is "Not yet".
							 *
							 * Hiding it on "Not yet" would collapse the dialog width every
							 * time somebody clicked between the two, which turns a
							 * comparison into a flicker. Dimming says the same thing and
							 * holds the layout still.
							 */
							<figure
								className={cn(
									"hidden w-[440px] shrink-0 flex-col gap-2 transition-opacity duration-300 md:flex",
									answers.landing === "none" && "opacity-30",
								)}
							>
								<div className="h-[420px] overflow-y-auto rounded-[10px] border border-white/12 bg-[#efedeb]">
									<LandingPreview />
								</div>
								<figcaption className="text-[12px] text-ink-muted">
									A scale model of the page — every band, in order. Scroll it.
								</figcaption>
							</figure>
						)}
					</div>
				)}

				<FormError message={error} />

				<div className="flex items-center gap-3">
					{step > 0 && (
						<button
							className={cn(
								buttonVariants({ variant: "secondary" }),
								"h-11 rounded-[8px]",
							)}
							disabled={busy}
							onClick={() => setStep(step - 1)}
							type="button"
						>
							Back
						</button>
					)}

					<button
						className={cn(
							buttonVariants({ variant: "primary" }),
							"h-11 flex-1 rounded-[8px]",
						)}
						disabled={!ready || busy}
						onClick={next}
						type="button"
					>
						{last ? (busy ? "Generating…" : "Generate starter") : "Continue"}
					</button>
				</div>
			</div>
		</Dialog>
	);
}
