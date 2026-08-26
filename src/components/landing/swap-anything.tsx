import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Section 07 — modularity.
 *
 * The claim is that a choice is a choice, not a fork. Each layer below is a
 * question the wizard asks, and the answer swings an adapter rather than a
 * rewrite: the files under `touches` are regenerated, and everything above them
 * is shared by every combination we ship.
 *
 * Deliberately no line counts. They used to be here and were checked against
 * this repo's own files, which was honest when the pitch was "clone this". The
 * pitch is now "we generate yours", and a number measured here would say
 * nothing true about the repo you receive. `touches` names paths, which is an
 * architectural commitment we can keep, rather than a count we would be
 * guessing at.
 */

type Seam = {
	/** Tab label. Must be a question the wizard actually asks — see `ANSWERS`. */
	layer: string;
	/** What the wizard offers for this layer. Never more than we will ship. */
	options: string[];
	/** Where the answer lands in the repo you receive. */
	touches: string[];
	/** Why the seam holds — a concrete mechanism, not a slogan. */
	note: string;
};

/**
 * Exported so the spec can hold these layers against the wizard's questions.
 * If the two ever disagree, the page is advertising a choice nobody is offered.
 */
export const SEAMS: Seam[] = [
	{
		layer: "Framework",
		options: ["Next.js", "TanStack Start", "React + Vite"],
		touches: ["app entry", "routing", "server handlers"],
		note: "The widest choice on the list, and the reason the rest are cheap: routing and rendering live in a framework adapter, so nothing above them has to know which one you picked. React + Vite is the one that changes what else is possible — a browser-only app has nowhere to keep a secret, so the questions after it narrow to what can run without a server.",
	},
	{
		layer: "Database",
		options: ["Neon", "Supabase", "PlanetScale", "Turso", "MongoDB"],
		touches: ["db/client", "connection env"],
		note: "Moving between the SQL hosts is one driver module and a connection string, so call sites never move. MongoDB is the honest exception — a document store is a different shape, and the next question narrows to match.",
	},
	{
		layer: "ORM",
		options: ["Drizzle", "Prisma", "Mongoose", "Supabase client"],
		touches: ["db/schema", "migrations", "db/client"],
		note: "Drizzle is SQL-only and Mongoose is MongoDB-only; Prisma spans both. You are shown whichever of the three your database can actually work with, not all three and a footnote. All three open a connection with a credential, so a browser-only app is offered the Supabase client instead — the same data, reached over HTTP with row level security doing the work.",
	},
	{
		layer: "Auth",
		options: ["Better Auth", "Supabase Auth", "Neon Auth", "Clerk", "Auth0"],
		touches: ["auth config", "auth client", "route handler"],
		note: "Supabase Auth and Neon Auth are parts of their host, so they appear only when you have chosen it — a pairing that cannot work is never offered in the first place. The rest hold their own users and work with any database.",
	},
	{
		layer: "Email",
		options: ["Resend", "Mailgun", "Brevo", "Not yet"],
		touches: ["lib/email", "provider key"],
		note: "One module, `src/lib/email.ts`, and one function — `sendEmail`. The rest of the app asks for an email to be sent and never learns which service sent it, so changing provider is one file and one key.",
	},
];

/** How long each seam is shown before the panel advances. */
const CYCLE_MS = 4200;

/**
 * Advances through the seams on a loop. Starts at 0 so the server and the
 * client's first paint agree, and stops permanently once the reader picks a tab
 * themselves — an auto-advancing panel that fights your click is hostile.
 */
function useSeamCycle(count: number) {
	const [index, setIndex] = useState(0);
	const [pinned, setPinned] = useState(false);

	useEffect(() => {
		if (pinned) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const id = setInterval(() => {
			setIndex((i) => (i + 1) % count);
		}, CYCLE_MS);

		return () => clearInterval(id);
	}, [count, pinned]);

	return {
		index,
		pin: (next: number) => {
			setIndex(next);
			setPinned(true);
		},
	};
}

function Chip({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center rounded-[6px] border border-brand/40 bg-brand-dim px-2.5 py-1 font-mono text-[12px] whitespace-nowrap text-brand">
			{children}
		</span>
	);
}

function SeamPanel({ seam }: { seam: Seam }) {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center gap-2">
				{seam.options.map((option) => (
					<Chip key={option}>{option}</Chip>
				))}
			</div>

			<ul className="flex flex-col gap-px overflow-hidden rounded-[10px] border border-line bg-line">
				{seam.touches.map((path) => (
					<li
						key={path}
						className="flex items-center justify-between gap-4 bg-elevated px-3.5 py-2.5 font-mono text-[12px] sm:text-[13px]"
					>
						<span className="truncate text-ink-soft">{path}</span>
						<span className="shrink-0 text-sage">generated</span>
					</li>
				))}
			</ul>

			<p className="text-[14px] leading-[1.6] text-ink-muted">{seam.note}</p>

			<p className="border-line border-t pt-4 font-mono text-[12px] text-ink-muted">
				<span className="text-ink-soft">
					{seam.touches.length} places change
				</span>{" "}
				&middot; routes, components, and business logic untouched
			</p>
		</div>
	);
}

export function SwapAnything() {
	const { index, pin } = useSeamCycle(SEAMS.length);
	const seam = SEAMS[index];

	return (
		<Section tone="base">
			<Container>
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					<FadeUp>
						<SectionHeading
							eyebrow="Modularity"
							title="Swap anything"
							description="Every question the wizard asks maps to an adapter, not a fork. Picking Prisma over Drizzle changes the files below and nothing above them."
						/>
						<p className="mt-6 max-w-[520px] text-[14px] leading-[1.6] text-ink-muted">
							This is also why the list can grow. A new framework or a new
							database is another adapter behind the same seam, so adding one
							does not multiply the templates we maintain — and every
							combination still has to go green in CI before it is offered.
						</p>
					</FadeUp>

					<FadeUp
						step={1}
						className="rounded-[20px] border border-white/6 bg-forest p-4 sm:p-6"
					>
						{/*
						 * A tablist rather than decorative dots: the panel auto-advances,
						 * but a reader who wants the database seam should not have to wait
						 * for the carousel to come back around.
						 */}
						<div
							aria-label="Swappable layers"
							className="mb-5 flex flex-wrap gap-1.5"
							role="tablist"
						>
							{SEAMS.map((s, i) => (
								<button
									aria-controls="seam-panel"
									aria-selected={i === index}
									className={cn(
										"rounded-[6px] px-3 py-1.5 text-[13px] transition-colors",
										i === index
											? "bg-card-deep text-ink"
											: "text-ink-muted hover:bg-white/5 hover:text-ink-soft",
									)}
									id={`seam-tab-${s.layer}`}
									key={s.layer}
									onClick={() => pin(i)}
									role="tab"
									type="button"
								>
									{s.layer}
								</button>
							))}
						</div>

						<div
							aria-labelledby={`seam-tab-${seam.layer}`}
							id="seam-panel"
							role="tabpanel"
						>
							<SeamPanel seam={seam} />
						</div>
					</FadeUp>
				</div>
			</Container>
		</Section>
	);
}
