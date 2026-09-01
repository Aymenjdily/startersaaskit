import { useState } from "react";
import { Panel, Section } from "@/components/console/panel";
import type { GuideStep } from "@/lib/generate/guide";
import { cn } from "@/lib/utils";

/**
 * How to use a starter, on the starter's own page.
 *
 * The steps arrive already derived from the generated files — see
 * `lib/generate/guide.ts` — so nothing here decides what to say, only how to
 * show it. That split is the point: the copy cannot drift from the project it
 * describes, because it is read out of it.
 *
 * Commands are copyable. Retyping `npm run generate-routes` from a screen is
 * the kind of small friction that makes a guide go unread.
 */

function CopyButton({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			className={cn(
				"shrink-0 rounded-[6px] border px-2 py-1 text-[11px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
				copied
					? "border-brand/50 bg-brand-dim text-brand"
					: "border-white/8 text-ink-muted hover:border-white/25 hover:text-ink",
			)}
			onClick={() => {
				/* `?.` because the clipboard API is absent on an insecure origin,
				   and a guide that throws when copied is worse than one that does
				   nothing. */
				navigator.clipboard?.writeText(value).then(
					() => {
						setCopied(true);
						setTimeout(() => setCopied(false), 1200);
					},
					() => {},
				);
			}}
			type="button"
		>
			{/* The label changes rather than a tooltip appearing: this is the only
			    feedback that the click did anything. */}
			{copied ? "Copied" : "Copy"}
		</button>
	);
}

/**
 * Renders the backticks in a step's body as code rather than as backticks.
 *
 * The guide is written in `lib/generate/guide.ts` the way a README is, using
 * backticks for filenames. Printing them raw made the page look like an
 * un-rendered markdown file.
 */
function Prose({ text }: { text: string }) {
	return (
		<>
			{text.split(/`([^`]+)`/).map((part, index) =>
				/* Odd indices are what sat between a pair of backticks: `split`
				   keeps the captured group, so the parity is the marker. */
				index % 2 === 1 ? (
					<code
						className="rounded-[4px] bg-white/8 px-1 py-0.5 font-mono text-[12px] text-ink"
						// biome-ignore lint/suspicious/noArrayIndexKey: the split's order is the identity
						key={index}
					>
						{part}
					</code>
				) : (
					part
				),
			)}
		</>
	);
}

function CommandRow({ command, note }: { command: string; note?: string }) {
	return (
		<div className="flex items-center gap-3 rounded-[8px] border border-white/8 bg-black/30 px-3 py-2">
			<code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink">
				<span aria-hidden="true" className="mr-2 select-none text-ink-muted/70">
					$
				</span>
				{command}
			</code>
			{note && (
				<span className="hidden shrink-0 text-[11px] text-ink-muted/70 sm:block">
					{note}
				</span>
			)}
			<CopyButton value={command} />
		</div>
	);
}

export function StarterGuide({
	steps,
	tour,
}: {
	steps: GuideStep[];
	tour: { path: string; what: string }[];
}) {
	return (
		<div className="flex flex-col gap-8">
			<Section
				description="Every command here comes from this starter's own package.json, and every variable from its .env.example — so the steps are the steps for this stack, not the general shape of one."
				title="How to use this"
			>
				<ol className="flex flex-col gap-3">
					{steps.map((step, index) => (
						<li key={step.title}>
							<Panel className="p-5">
								<div className="flex gap-4">
									<span
										aria-hidden="true"
										className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/6 font-medium text-[12px] text-ink-muted"
									>
										{index + 1}
									</span>

									<div className="flex min-w-0 flex-1 flex-col gap-3">
										<div>
											<h3 className="font-medium text-[14px] text-ink">
												{step.title}
											</h3>
											<p className="mt-1 text-[13px] text-ink-muted leading-[1.6]">
												<Prose text={step.body} />
											</p>
										</div>

										{step.commands && step.commands.length > 0 && (
											<div className="flex flex-col gap-2">
												{step.commands.map((command) => (
													<CommandRow
														command={command.command}
														key={command.command}
														note={command.note}
													/>
												))}
											</div>
										)}

										{step.variables && step.variables.length > 0 && (
											<dl className="flex flex-col gap-2 rounded-[8px] border border-white/8 p-3">
												{step.variables.map((variable) => (
													<div
														className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
														key={variable.name}
													>
														<dt className="font-mono text-[12px] text-ink">
															{variable.name}
														</dt>
														{/* Said plainly, because the prefix is the only
														    thing standing between a secret and every
														    visitor's browser. */}
														{variable.isPublic && (
															<span className="rounded-[4px] bg-white/8 px-1.5 py-0.5 text-[10px] text-ink-muted uppercase tracking-[0.05em]">
																public
															</span>
														)}
														<dd className="w-full text-[12px] text-ink-muted">
															{variable.comment}
														</dd>
													</div>
												))}
											</dl>
										)}
									</div>
								</div>
							</Panel>
						</li>
					))}
				</ol>
			</Section>

			{tour.length > 0 && (
				<Section
					description="One module per integration, named after the thing it integrates. Asked where authentication is configured, both a person and a model answer the same way without searching."
					title="Where to look first"
				>
					<Panel>
						<dl className="divide-y divide-white/8">
							{tour.map((entry) => (
								<div
									className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
									key={entry.path}
								>
									<dt className="font-mono text-[12.5px] text-ink">
										{entry.path}
									</dt>
									<dd className="text-[12.5px] text-ink-muted">{entry.what}</dd>
								</div>
							))}
						</dl>
					</Panel>
				</Section>
			)}
		</div>
	);
}
