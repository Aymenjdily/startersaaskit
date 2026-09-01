import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/controls";
import { buttonVariants } from "@/components/ui/button";
import { OptionList } from "@/components/ui/option-list";
import { type Answers, isAnswered, QUESTIONS } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/**
 * The questions a new account answers before the console opens.
 *
 * One question per screen, each with the reason we are asking. A single long
 * form gets abandoned and a form that will not say why it wants your job title
 * gets lied to, and both leave us with data we cannot act on.
 *
 * The notes step is last and optional — it is the only place someone can tell
 * us something we did not think to ask, which makes it the most valuable
 * answer on the worst days.
 */

/** The optional free-text screen that follows the fixed questions. */
export const NOTES_STEP = QUESTIONS.length;

export const TOTAL_STEPS = QUESTIONS.length + 1;

export function OnboardingWizard({
	initialAnswers = {},
	initialStep = 0,
	onFinish,
}: {
	initialAnswers?: Answers;
	initialStep?: number;
	/** Saving belongs to the route, which is the thing that knows who is signed in. */
	onFinish: (answers: Answers, notes: string) => Promise<void>;
}) {
	const [answers, setAnswers] = useState<Answers>(initialAnswers);
	const [notes, setNotes] = useState("");
	const [step, setStep] = useState(initialStep);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const question = QUESTIONS[step];
	const onNotes = step === NOTES_STEP;
	const ready = onNotes || isAnswered(question, answers[question.id]);

	async function next() {
		setError(null);

		if (!onNotes) {
			setStep(step + 1);
			return;
		}

		setSaving(true);
		try {
			await onFinish(answers, notes.trim());
		} catch (thrown) {
			setError(
				thrown instanceof Error
					? thrown.message
					: "Could not save your answers.",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<AuthShell
			eyebrow={
				<p className="mb-3 text-[13px] text-ink-muted">
					Step {step + 1} of {TOTAL_STEPS}
				</p>
			}
			size="wide"
			tagline={
				onNotes ? "Optional, and read by a person." : (question?.because ?? "")
			}
			title={onNotes ? "Anything we should know?" : (question?.prompt ?? "")}
		>
			<div className="flex flex-col gap-6">
				{/* Decorative: the step count above already says the same thing, and
				    a screen reader announcing a bar has nothing to work with. */}
				<div aria-hidden="true" className="h-1 rounded-full bg-white/10">
					<div
						className="h-full rounded-full bg-brand transition-[width] duration-300"
						style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
					/>
				</div>

				{onNotes ? (
					<textarea
						aria-label="Anything we should know?"
						className="min-h-[120px] w-full rounded-[8px] border border-white/8 bg-black/25 px-3 py-2.5 text-[14px] text-ink transition-colors duration-200 placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
						onChange={(event) => setNotes(event.target.value)}
						placeholder="What would make this obviously worth using for you?"
						value={notes}
					/>
				) : (
					<OptionList
						multiple={question.multiple}
						name={question.id}
						onChange={(value) =>
							setAnswers({ ...answers, [question.id]: value })
						}
						options={question.options}
						value={answers[question.id]}
					/>
				)}

				<FormError message={error} />

				<div className="flex items-center gap-3">
					{step > 0 && (
						<button
							className={cn(
								buttonVariants({ variant: "secondary" }),
								"h-11 rounded-[8px]",
							)}
							onClick={() => {
								setError(null);
								setStep(step - 1);
							}}
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
						disabled={!ready || saving}
						onClick={next}
						type="button"
					>
						{onNotes ? (saving ? "Saving…" : "Finish") : "Continue"}
					</button>
				</div>
			</div>
		</AuthShell>
	);
}
