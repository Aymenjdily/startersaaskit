import { useEffect, useMemo, useState } from "react";
import type { TreeNode } from "@/lib/generate/file-tree";
import {
	previewKey,
	type StarterFile,
	type StarterPreview,
	starterFile,
} from "@/lib/starter-preview";
import {
	optionsFor,
	STARTER_QUESTIONS,
	type StarterOption,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

/**
 * The generator, running in the hero.
 *
 * ## Why this replaced a screenshot
 *
 * The panel here used to say "a walkthrough of the generator is on the way".
 * The product *is* an interactive wizard, so the most convincing thing the page
 * can do is let someone use a piece of it before signing up — and the tree
 * below is real output from the real `buildStarter`, not a drawing of one.
 *
 * ## What it is really demonstrating
 *
 * Not the file list. The claim this product rests on is that answers constrain
 * each other, so you cannot assemble a stack that does not fit together. Pick
 * React + Vite and four of the five databases go dim, because a browser-only
 * app has no server to hold a connection string. That is the argument, made by
 * letting someone hit the wall rather than by describing it.
 *
 * The disabling is computed by the same `optionsFor` the real wizard uses, so
 * this cannot drift into demonstrating a rule the product no longer has.
 */
export function HeroGenerator({ previews }: { previews: StarterPreview[] }) {
	const frameworks = optionsOf("framework");
	const databases = optionsOf("database");

	const [framework, setFramework] = useState(frameworks[0]?.id ?? "nextjs");
	const [database, setDatabase] = useState(databases[0]?.id ?? "neon");
	const [open, setOpen] = useState<StarterFile | null>(null);

	/** The databases this framework can actually hold. */
	const legal = useMemo(
		() =>
			new Set(optionsFor(question("database"), { framework }).map((o) => o.id)),
		[framework],
	);

	const preview = previews.find(
		(candidate) =>
			previewKey(candidate.framework, candidate.database) ===
			previewKey(framework, database),
	);

	/**
	 * Fall back to the file the server chose for this combination.
	 *
	 * Changing the stack invalidates whatever was open — `schema.ts` in a Drizzle
	 * repo does not exist in a Supabase-client one — so the panel drops back to
	 * the opening file rather than showing source from a starter nobody is
	 * looking at any more.
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: the open file is cleared *because* the combination changed; depending on it would clear it again on every click
	useEffect(() => {
		setOpen(null);
	}, [framework, database]);

	const shown = open ?? preview?.opening ?? null;

	async function show(path: string) {
		if (!preview || path === shown?.path) return;

		try {
			setOpen(await starterFile({ data: { framework, database, path } }));
		} catch {
			/* A file that cannot be read leaves the last one on screen. An empty
			   pane would look like the click broke something. */
		}
	}

	/**
	 * Choosing a framework can invalidate the database already chosen.
	 *
	 * The wizard prunes the dead answer; here it moves to the first one that
	 * still works, because a hero panel that renders nothing while the visitor
	 * works out what they broke is worse than one that quietly follows them.
	 */
	function chooseFramework(next: string) {
		const allowed = optionsFor(question("database"), { framework: next });

		setFramework(next);

		if (!allowed.some((option) => option.id === database)) {
			setDatabase(allowed[0]?.id ?? database);
		}
	}

	return (
		<div className="overflow-hidden rounded-xl border border-line bg-elevated">
			<div className="flex items-center gap-2 border-b border-line px-4 py-3">
				<span className="size-2.5 rounded-full bg-white/15" />
				<span className="size-2.5 rounded-full bg-white/15" />
				<span className="size-2.5 rounded-full bg-white/15" />
				<span className="ml-2 font-mono text-[12px] text-ink-muted">
					my-app — generated live
				</span>
			</div>

			<div className="flex flex-col gap-4 border-b border-line px-4 py-4">
				<Row
					label="Framework"
					onChange={chooseFramework}
					options={frameworks}
					value={framework}
				/>
				<Row
					label="Database"
					legal={legal}
					onChange={setDatabase}
					options={databases}
					value={database}
				/>
			</div>

			{/* A fixed height, not one that follows the content. Without it the
			    whole page below jumps every time somebody changes an answer, which
			    is the fastest way to make an interactive panel feel broken. */}
			<div className="grid h-[300px] grid-cols-1 sm:h-[380px] md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
				<div className="overflow-y-auto border-line px-4 py-3 md:border-r">
					{preview ? (
						<ul className="font-mono text-[12px] leading-[1.7]">
							<Branch
								nodes={preview.tree}
								onOpen={show}
								openPath={shown?.path ?? null}
							/>
						</ul>
					) : (
						<p className="text-[13px] text-ink-muted">
							No preview for that pairing yet.
						</p>
					)}
				</div>

				{/**
				 * The file itself, which is the whole reason the tree is worth
				 * showing. A list of names proves a repo has structure; the source
				 * proves somebody wrote it.
				 *
				 * Hidden below `md`. Forty columns of TypeScript on a phone is a
				 * horizontal scrollbar with a paragraph inside it, and the tree
				 * alone still makes the point at that width.
				 */}
				<div className="hidden min-w-0 flex-col md:flex">
					<div className="flex items-center gap-2 border-line border-b px-4 py-2">
						<span className="truncate font-mono text-[11px] text-ink-muted">
							{shown ? shown.path : "—"}
						</span>
					</div>

					<pre className="min-h-0 flex-1 overflow-auto px-4 py-3">
						{/* `tabSize` because the generator writes tabs, and a browser's
						    default of 8 turns nested JSX into a horizontal scroll. */}
						<code
							className="font-mono text-[11px] text-ink-soft leading-[1.6]"
							style={{ tabSize: 2 }}
						>
							{shown?.source ?? ""}
						</code>
					</pre>
				</div>
			</div>

			<div className="flex items-center justify-between border-line border-t px-4 py-3 font-mono text-[12px] text-ink-muted">
				{/* Counted from the generated paths on the server, never typed here. */}
				<span>
					{preview ? `${preview.files} files · ${preview.tests} tests` : "—"}
				</span>
				<span className="text-sage">ready to run</span>
			</div>
		</div>
	);
}

/** One question, as a row of chips. */
function Row({
	label,
	legal,
	onChange,
	options,
	value,
}: {
	label: string;
	/** Ids still allowed. Everything else is shown, dimmed and unclickable. */
	legal?: Set<string>;
	onChange: (id: string) => void;
	options: readonly StarterOption[];
	value: string;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="w-[74px] shrink-0 text-[12px] text-ink-muted">
				{label}
			</span>

			{options.map((option) => {
				const allowed = !legal || legal.has(option.id);
				const active = option.id === value;

				return (
					<button
						className={cn(
							"rounded-[6px] border px-2.5 py-1 text-[12px] transition-colors duration-200",
							active
								? "border-brand/40 bg-brand/15 text-ink"
								: "border-line text-ink-soft hover:border-white/25 hover:text-ink",
							/* Dimmed rather than hidden: the point is that the visitor
							   sees the option disappear from reach, not that it was never
							   there. `title` says why, since a dead chip explains nothing
							   on its own. */
							!allowed &&
								"cursor-not-allowed border-line/60 text-ink-muted/60 hover:border-line/60 hover:text-ink-muted/60",
						)}
						disabled={!allowed}
						key={option.id}
						onClick={() => onChange(option.id)}
						title={
							allowed
								? undefined
								: "Needs a framework that runs code on a server"
						}
						type="button"
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

/** The tree, drawn as an indented list rather than with the console's accordion. */
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
			{nodes.map((node) => {
				const folder = Boolean(node.children);

				return (
					<li key={node.id}>
						{folder ? (
							<span
								className="block truncate text-ink-soft"
								style={{ paddingLeft: depth * 14 }}
							>
								<span className="text-ink-muted/60">▸ </span>
								{node.name}/
							</span>
						) : (
							/* A button, not a div with a click handler: files are
							   openable, so they belong in the tab order and answer the
							   keyboard without any of this being reimplemented. */
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
								<span className="text-ink-muted/60">{"  "}</span>
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
				);
			})}
		</>
	);
}

function question(id: "framework" | "database") {
	const found = STARTER_QUESTIONS.find((candidate) => candidate.id === id);

	if (!found) throw new Error(`no "${id}" question`);

	return found;
}

function optionsOf(id: "framework" | "database"): readonly StarterOption[] {
	return question(id).options ?? [];
}
