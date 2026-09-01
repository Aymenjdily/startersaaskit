import type { LucideIcon } from "lucide-react";
import {
	Blocks,
	Database,
	FileCode2,
	KeyRound,
	Mail,
	Table2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { NeutralGlyph } from "@/components/ui/option-cards";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { BrandGlyph } from "./brand-glyph";
import type { BrandIcon } from "./brand-icons";

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
	/** The mark the tab carries. */
	icon: LucideIcon;
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
		icon: Blocks,
		options: ["Next.js", "TanStack Start", "React + Vite"],
		touches: ["app entry", "routing", "server handlers"],
		note: "The widest choice, and why the rest are cheap: routing and rendering sit in a framework adapter, invisible above it. React + Vite is the exception — with no server to keep a secret, later questions narrow to match.",
	},
	{
		layer: "Database",
		icon: Database,
		options: ["Neon", "Supabase", "PlanetScale", "Turso", "MongoDB"],
		touches: ["db/client", "connection env"],
		note: "Moving between the SQL hosts is one driver module and a connection string, so call sites never move. MongoDB is the honest exception — a document store is a different shape, and the next question narrows to match.",
	},
	{
		layer: "ORM",
		icon: Table2,
		options: ["Drizzle", "Prisma", "Mongoose", "Supabase client"],
		touches: ["db/schema", "migrations", "db/client"],
		note: "Drizzle is SQL-only, Mongoose is MongoDB-only, Prisma spans both — you're shown whichever fits your database. A browser-only app has no credential to hold, so it gets the Supabase client instead: the same data over HTTP, secured by row level security.",
	},
	{
		layer: "Auth",
		icon: KeyRound,
		options: ["Better Auth", "Supabase Auth", "Neon Auth", "Clerk", "Auth0"],
		touches: ["auth config", "auth client", "route handler"],
		note: "Supabase Auth and Neon Auth are parts of their host, so they appear only when you have chosen it — a pairing that cannot work is never offered in the first place. The rest hold their own users and work with any database.",
	},
	{
		layer: "Email",
		icon: Mail,
		options: ["Resend", "Mailgun", "Brevo", "Not yet"],
		touches: ["lib/email", "provider key"],
		note: "One module, `src/lib/email.ts`, and one function — `sendEmail`. The rest of the app asks for an email to be sent and never learns which service sent it, so changing provider is one file and one key.",
	},
];

/**
 * The panel's height must not jump as the seams cycle, so every variable-count
 * list is padded out to the widest seam's count rather than left to its own
 * length. Derived from `SEAMS` so a new seam with more options never falls out
 * of sync with the padding again.
 */
const MAX_OPTIONS = Math.max(...SEAMS.map((s) => s.options.length));
const MAX_TOUCHES = Math.max(...SEAMS.map((s) => s.touches.length));

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

/**
 * The vendor mark each option carries, keyed by the label the wizard prints.
 * Options stay plain strings — the spec reads them — so the mark hangs off the
 * label rather than the data. "Not yet" is not a product and gets the neutral
 * glyph, the same treatment the wizard gives it.
 */
const OPTION_ICONS: Record<string, BrandIcon | null> = {
	"Next.js": "nextdotjs",
	"TanStack Start": "tanstack",
	"React + Vite": "react",
	Neon: "neon",
	Supabase: "supabase",
	PlanetScale: "planetscale",
	Turso: "turso",
	MongoDB: "mongodb",
	Drizzle: "drizzle",
	Prisma: "prisma",
	Mongoose: "mongoose",
	"Supabase client": "supabase",
	"Better Auth": "betterauth",
	"Supabase Auth": "supabase",
	"Neon Auth": "neon",
	Clerk: "clerk",
	Auth0: "auth0",
	Resend: "resend",
	Mailgun: "mailgun",
	Brevo: "brevo",
	"Not yet": null,
};

/**
 * An option drawn the way the wizard draws it: the vendor's mark in a tile,
 * the name beside it. Same choice here as there, so the landing page and the
 * generator read as one product.
 */
function OptionTile({ label }: { label: string }) {
	const icon = OPTION_ICONS[label];

	return (
		<span className="flex items-center gap-2.5 rounded-[10px] border border-white/8 bg-black/25 px-3 py-2.5">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white/6 text-ink-soft">
				{icon ? (
					<BrandGlyph className="size-4" icon={icon} />
				) : (
					<NeutralGlyph className="size-4" />
				)}
			</span>
			<span className="truncate text-[13px] text-ink-soft">{label}</span>
		</span>
	);
}

/** An `OptionTile`-shaped slot with nothing in it — holds the grid's row count steady for a seam with fewer options than the widest one. */
function OptionTileSlot() {
	return (
		<span
			aria-hidden="true"
			className="invisible flex items-center gap-2.5 rounded-[10px] border border-white/8 bg-black/25 px-3 py-2.5"
		>
			<span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white/6" />
			<span className="truncate text-[13px]">&nbsp;</span>
		</span>
	);
}

/** A touches-row-shaped slot with nothing in it, for the same reason as `OptionTileSlot`. */
function TouchRowSlot() {
	return (
		<li
			aria-hidden="true"
			className="invisible flex items-center justify-between gap-4 bg-elevated px-3.5 py-2.5 font-mono text-[12px] sm:text-[13px]"
		>
			<span className="flex min-w-0 items-center gap-2.5">
				<FileCode2 aria-hidden="true" className="size-3.5 shrink-0" />
				<span>&nbsp;</span>
			</span>
			<span>&nbsp;</span>
		</li>
	);
}

function SeamPanel({ seam }: { seam: Seam }) {
	return (
		<div className="flex flex-col gap-5">
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{seam.options.map((option) => (
					<OptionTile key={option} label={option} />
				))}
				{Array.from({ length: MAX_OPTIONS - seam.options.length }).map(
					(_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-count padding, never reordered
						<OptionTileSlot key={i} />
					),
				)}
			</div>

			<ul className="flex flex-col gap-px overflow-hidden rounded-[10px] border border-line bg-line">
				{seam.touches.map((path) => (
					<li
						key={path}
						className="flex items-center justify-between gap-4 bg-elevated px-3.5 py-2.5 font-mono text-[12px] sm:text-[13px]"
					>
						<span className="flex min-w-0 items-center gap-2.5">
							<FileCode2
								aria-hidden="true"
								className="size-3.5 shrink-0 text-ink-muted"
							/>
							<span className="truncate text-ink-soft">{path}</span>
						</span>
						<span className="shrink-0 text-sage">generated</span>
					</li>
				))}
				{Array.from({ length: MAX_TOUCHES - seam.touches.length }).map(
					(_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-count padding, never reordered
						<TouchRowSlot key={i} />
					),
				)}
			</ul>

			{/* Every note is written to fit three lines at the desktop width this
			    panel renders at — checked by the length assertion in the spec, not
			    just eyeballed. Below `sm` the same text wraps across roughly twice
			    as many lines, so the clamp and the reserved floor both widen there;
			    at every width the two together mean the panel can neither grow nor
			    shrink as the seams cycle. `lh` rather than a measured pixel figure,
			    so the box stays true if the type scale ever changes. */}
			<p className="line-clamp-6 min-h-[6lh] text-[14px] leading-[1.6] text-ink-muted sm:line-clamp-3 sm:min-h-[3lh]">
				{seam.note}
			</p>

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
						className="rounded-[20px] border border-white/8 bg-forest p-4 sm:p-6"
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
										"flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] transition-colors",
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
									<s.icon aria-hidden="true" className="size-3.5 shrink-0" />
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
