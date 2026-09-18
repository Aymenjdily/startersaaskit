import { useEffect, useRef, useState } from "react";
import type { TreeNode } from "@/lib/generate/file-tree";
import {
	type BuiltStarter,
	type StarterFile,
	starterBuild,
	starterSource,
} from "@/lib/starter-preview";
import {
	describeRequirement,
	isProjectNameValid,
	optionsFor,
	STARTER_QUESTIONS,
	type StarterAnswers,
	type StarterOption,
	type StarterQuestion,
	type StarterQuestionId,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

/**
 * The whole generator, with no account in the way.
 *
 * ## Why this is not the wizard
 *
 * `CreateStarterDialog` asks one question per screen, which is right for
 * somebody who has already decided to generate: it keeps the commitment small
 * and the current question unmissable.
 *
 * This page is for somebody deciding whether the product is worth an email
 * address, and that is a different job. Every answer is on screen at once, so
 * changing one and watching the tree change is a single glance rather than a
 * round trip through six other screens. The claim the product rests on — that
 * answers constrain each other — is only legible if you can see the answers
 * constrain each other.
 *
 * ## Why the server still builds it
 *
 * `buildStarter` is pure and would run here perfectly well. It also carries
 * every template string the generator owns, which is larger than the rest of
 * this site put together — see the note in `starter-preview.ts`. So the same
 * arrangement as the hero: the server builds, the browser gets paths, and one
 * file's source arrives when somebody clicks it.
 *
 * ## What the visitor is never asked for
 *
 * Nothing. There is no account, no email, no quota spent. The wall is where it
 * always was, on `/api/generate`, which is the endpoint that writes a row and
 * returns an archive. Reading is free; taking delivery is what needs a name.
 */

const CHOICES = STARTER_QUESTIONS.filter(
	(question) => question.kind === "choice",
);

/** Whether two answer sets say the same thing, question by question. */
function same(a: StarterAnswers, b: StarterAnswers): boolean {
	return STARTER_QUESTIONS.every(
		(question) => a[question.id] === b[question.id],
	);
}

export function StarterBuilder({
	initial,
	onAnswersChange,
}: {
	initial: StarterAnswers;
	/** Called with the answers the server actually built, for the URL. */
	onAnswersChange?: (answers: StarterAnswers) => void;
}) {
	const [answers, setAnswers] = useState<StarterAnswers>(initial);
	const [built, setBuilt] = useState<BuiltStarter | null>(null);
	const [open, setOpen] = useState<StarterFile | null>(null);
	const [failed, setFailed] = useState(false);

	/**
	 * Which request is current.
	 *
	 * Answers change faster than a round trip completes, and a slow response to
	 * a stack nobody is looking at any more must not overwrite a fast response
	 * to the one on screen.
	 */
	const latest = useRef(0);

	/* `onAnswersChange` reports a build; it must never cause one. Depending on
	   it would refetch every time the parent re-rendered. */
	// biome-ignore lint/correctness/useExhaustiveDependencies: the answers are what this effect is about
	useEffect(() => {
		const mine = ++latest.current;

		setFailed(false);
		starterBuild({ data: { answers } })
			.then((result) => {
				if (mine !== latest.current) return;

				setBuilt(result);
				/* Whatever was open belongs to a starter that may no longer have
				   it — `schema.ts` exists under Drizzle and not under the Supabase
				   client — so the panel drops back to the file the server chose. */
				setOpen(null);
				/**
				 * Adopt what the server built.
				 *
				 * A first visit sends nothing and gets back a complete stack, and
				 * without this the chips would go on reasoning about the empty set
				 * they were mounted with — every option that needs a framework tag
				 * drawn as unavailable while the tree beside it shows a starter
				 * using exactly those options.
				 *
				 * Safe to feed back in: `sanitiseAnswers` is idempotent, so the
				 * build this triggers returns the same answers, `same` holds, and
				 * the state stops changing. `starter-sanitise.test.ts` is what
				 * keeps that true.
				 */
				setAnswers((current) =>
					same(current, result.answers) ? current : result.answers,
				);
				onAnswersChange?.(result.answers);
			})
			.catch(() => {
				if (mine === latest.current) setFailed(true);
			});
	}, [answers]);

	async function show(path: string) {
		if (path === (open ?? built?.opening)?.path) return;

		try {
			setOpen(await starterSource({ data: { answers, path } }));
		} catch {
			/* A file that will not open leaves the last one on screen. An empty
			   pane reads as a broken click. */
		}
	}

	/**
	 * Answer a question, and drop anything that answer just invalidated.
	 *
	 * Local pruning so the chips update on the click rather than a round trip
	 * later. The server prunes again on arrival and its result is what the page
	 * ends up rendering — this is responsiveness, not the rule.
	 */
	function answer(question: StarterQuestion, id: string) {
		setAnswers((current) => {
			const next: StarterAnswers = { ...current, [question.id]: id };

			for (const other of CHOICES) {
				const chosen = next[other.id];

				if (
					chosen !== undefined &&
					!optionsFor(other, next).some((option) => option.id === chosen)
				) {
					delete next[other.id];
				}
			}
			return next;
		});
	}

	const shown = open ?? built?.opening ?? null;
	const project = answers.project ?? "";
	const nameLooksWrong = project !== "" && !isProjectNameValid(project);

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start">
			<div className="flex flex-col gap-5 rounded-xl border border-line bg-elevated p-5">
				<div className="flex flex-col gap-1.5">
					<label
						className="text-[12px] text-ink-muted"
						htmlFor="builder-project"
					>
						Project
					</label>
					<input
						aria-invalid={nameLooksWrong}
						className={cn(
							"rounded-[8px] border bg-base px-3 py-2 font-mono text-[13px] text-ink outline-none",
							nameLooksWrong
								? "border-diagram-red/60"
								: "border-line focus:border-white/25",
						)}
						id="builder-project"
						onChange={(event) =>
							setAnswers({ ...answers, project: event.target.value })
						}
						placeholder="my-app"
						value={project}
					/>
					{nameLooksWrong && (
						<p className="text-[11px] text-diagram-red">
							Lowercase letters, digits and dashes, starting with a letter or
							digit.
						</p>
					)}
				</div>

				{CHOICES.map((question) => (
					<Row
						answers={answers}
						key={question.id}
						onChange={(id) => answer(question, id)}
						question={question}
					/>
				))}
			</div>

			<div className="overflow-hidden rounded-xl border border-line bg-elevated">
				<div className="flex items-center gap-2 border-b border-line px-4 py-3">
					<span className="size-2.5 rounded-full bg-white/15" />
					<span className="size-2.5 rounded-full bg-white/15" />
					<span className="size-2.5 rounded-full bg-white/15" />
					<span className="ml-2 truncate font-mono text-[12px] text-ink-muted">
						{built?.answers.project ?? "my-app"}
					</span>
				</div>

				{/* A fixed height rather than one that follows the content: without
				    it the page jumps on every answer, which reads as breakage. */}
				<div className="grid h-[420px] grid-cols-1 sm:h-[520px] md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
					<div className="overflow-y-auto border-line px-4 py-3 md:border-r">
						{built ? (
							<ul className="font-mono text-[12px] leading-[1.7]">
								<Branch
									nodes={built.tree}
									onOpen={show}
									openPath={shown?.path ?? null}
								/>
							</ul>
						) : (
							<p className="text-[13px] text-ink-muted">
								{failed ? "Could not build that stack." : "Building…"}
							</p>
						)}
					</div>

					{/* Hidden below `md`: forty columns of TypeScript on a phone is a
					    horizontal scrollbar with a paragraph inside it. */}
					<div className="hidden min-w-0 flex-col md:flex">
						<div className="flex items-center gap-2 border-line border-b px-4 py-2">
							<span className="truncate font-mono text-[11px] text-ink-muted">
								{shown ? shown.path : "—"}
							</span>
						</div>

						<pre className="min-h-0 flex-1 overflow-auto px-4 py-3">
							{/* `tabSize` because the generator writes tabs, and a
							    browser's default of 8 turns nested JSX into a scroll. */}
							<code
								className="font-mono text-[11px] text-ink-soft leading-[1.6]"
								style={{ tabSize: 2 }}
							>
								{shown?.source ?? ""}
							</code>
						</pre>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-line border-t px-4 py-3">
					{/* Counted from the generated paths on the server, never here. */}
					<span className="font-mono text-[12px] text-ink-muted">
						{built ? `${built.files} files · ${built.tests} tests` : "—"}
					</span>
					<span className="font-mono text-[12px] text-sage">
						no account needed to read any of it
					</span>
				</div>
			</div>
		</div>
	);
}

/** One question, as a row of chips. */
function Row({
	answers,
	onChange,
	question,
}: {
	answers: StarterAnswers;
	onChange: (id: string) => void;
	question: StarterQuestion;
}) {
	const legal = new Set(
		optionsFor(question, answers).map((option) => option.id),
	);

	return (
		<div className="flex flex-col gap-2">
			<span className="text-[12px] text-ink-muted">{question.label}</span>

			<div className="flex flex-wrap gap-1.5">
				{(question.options ?? []).map((option) => (
					<Chip
						active={option.id === answers[question.id]}
						allowed={legal.has(option.id)}
						key={option.id}
						onChange={onChange}
						option={option}
					/>
				))}
			</div>
		</div>
	);
}

function Chip({
	active,
	allowed,
	onChange,
	option,
}: {
	active: boolean;
	allowed: boolean;
	onChange: (id: string) => void;
	option: StarterOption;
}) {
	return (
		<button
			className={cn(
				"rounded-[6px] border px-2.5 py-1 text-[12px] transition-colors duration-200",
				active
					? "border-brand/40 bg-brand/15 text-ink"
					: "border-line text-ink-soft hover:border-white/25 hover:text-ink",
				/* Dimmed rather than removed. The visitor seeing an option go out
				   of reach *is* the argument; an option that silently vanishes
				   makes no argument at all. */
				!allowed &&
					"cursor-not-allowed border-line/60 text-ink-muted/60 hover:border-line/60 hover:text-ink-muted/60",
			)}
			disabled={!allowed}
			onClick={() => onChange(option.id)}
			title={allowed ? undefined : whyNot(option)}
			type="button"
		>
			{option.label}
		</button>
	);
}

/**
 * Why an option is out of reach.
 *
 * `describeRequirement` names the answers that *would* satisfy the rule —
 * "Framework to be Next.js or TanStack Start" — rather than the tag behind it,
 * which is an internal word no visitor should ever be shown. It is the same
 * sentence `answerProblems` writes, so the tooltip here and the explanation on
 * a stale starter cannot describe one rule two ways.
 */
function whyNot(option: StarterOption): string {
	const needs = Object.entries(option.requires ?? {}).map(([id, tag]) =>
		describeRequirement(id as StarterQuestionId, tag),
	);

	return needs.length > 0
		? `${option.label} needs ${needs.join(", and ")}.`
		: `${option.label} is not available with these answers.`;
}

/** The tree, drawn as an indented list. */
function Branch({
	depth = 0,
	nodes,
	onOpen,
	openPath,
}: {
	depth?: number;
	nodes: TreeNode[];
	onOpen: (path: string) => void;
	openPath: string | null;
}) {
	return (
		<>
			{nodes.map((node) => (
				<li key={node.id}>
					{node.children ? (
						<span
							className="block truncate text-ink-soft"
							style={{ paddingLeft: depth * 14 }}
						>
							<span className="text-ink-muted/60">▸ </span>
							{node.name}/
						</span>
					) : (
						/* A button, not a div with a handler: files are openable, so
						   they belong in the tab order and answer the keyboard
						   without any of that being reimplemented. */
						<button
							className={cn(
								"block w-full truncate text-left transition-colors",
								node.id === openPath
									? "text-ink"
									: "text-ink-muted hover:text-ink-soft",
							)}
							onClick={() => onOpen(node.id)}
							style={{ paddingLeft: depth * 14 }}
							type="button"
						>
							{node.name}
						</button>
					)}

					{node.children && (
						<ul>
							<Branch
								depth={depth + 1}
								nodes={node.children}
								onOpen={onOpen}
								openPath={openPath}
							/>
						</ul>
					)}
				</li>
			))}
		</>
	);
}
