import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandGlyph } from "./brand-glyph";
import type { BrandIcon } from "./brand-icons";

type WiredTask = { icon: BrandIcon; module: string; detail: string };

/**
 * The wiring a generated starter arrives with, not an inventory of this repo.
 * Entries span the whole catalogue on purpose — Next.js beside TanStack Start,
 * Prisma beside Drizzle — because no single generated repo contains all of it.
 * The grid is the menu, and the wizard is what picks from it.
 *
 * Supabase and Stripe belong here too. Their glyphs now exist in
 * `brand-icons.ts` — added for the console's starter dialog — so the reason
 * they were left out has gone; adding them here is a copy decision, not a
 * blocked one.
 */
const TASKS: WiredTask[] = [
	{ icon: "nextdotjs", module: "Next.js", detail: "App Router + layouts" },
	{ icon: "nextdotjs", module: "Next.js", detail: "Server actions" },
	{ icon: "tanstack", module: "TanStack Start", detail: "File-based routing" },
	{
		icon: "tanstack",
		module: "TanStack Start",
		detail: "Server-side rendering",
	},
	{ icon: "tanstack", module: "TanStack Router", detail: "Typed route tree" },
	{
		icon: "reactquery",
		module: "TanStack Query",
		detail: "Server state caching",
	},
	{
		icon: "betterauth",
		module: "Better Auth",
		detail: "Email + password sign-in",
	},
	{ icon: "betterauth", module: "Better Auth", detail: "Cookie sessions" },
	{ icon: "drizzle", module: "Drizzle ORM", detail: "Typed table schema" },
	{ icon: "drizzle", module: "Drizzle Kit", detail: "Migrations + studio" },
	{ icon: "prisma", module: "Prisma", detail: "Generated client" },
	{ icon: "prisma", module: "Prisma Migrate", detail: "Versioned migrations" },
	{ icon: "neon", module: "Neon", detail: "Serverless Postgres driver" },
	{ icon: "neon", module: "Neon", detail: "Branch per preview" },
	{ icon: "tailwindcss", module: "Tailwind CSS", detail: "v4 design tokens" },
	{ icon: "tailwindcss", module: "Tailwind CSS", detail: "Dark mode variant" },
	{ icon: "typescript", module: "TypeScript", detail: "Strict compiler" },
	{ icon: "typescript", module: "TypeScript", detail: "Path aliases" },
	{ icon: "biome", module: "Biome", detail: "Lint + format" },
	{ icon: "vite", module: "Vitest", detail: "Suite green on arrival" },
	{ icon: "vite", module: "Vite", detail: "HMR dev server" },
	{ icon: "react", module: "React 19", detail: "Concurrent runtime" },
	{ icon: "vercel", module: "Vercel", detail: "Deploy config included" },
];

/** 6 x 3, matching the reference. Below `lg` the grid reflows and tiles 11+ are hidden. */
const TILE_COUNT = 18;

const RUN_MIN_MS = 4000;
const RUN_JITTER_MS = 6000;
const DONE_HOLD_MS = 1600;
const EXIT_MS = 300;
const STAGGER_MS = 80;

type Phase = "running" | "done" | "exiting";

/**
 * `slot` is the tile's fixed position in the grid. It is the stable identity —
 * the task inside a slot changes on every cycle, but the slot never moves or
 * reorders, so it is what React should key on. Keying on the task instead would
 * remount the tile mid-transition and swallow the exit animation.
 */
type Tile = { slot: number; taskIndex: number; phase: Phase; cycle: number };

/**
 * Seeded deterministically so the server and client first paints agree; the
 * shuffling only starts once timers run on the client.
 */
const initialTiles = (): Tile[] =>
	Array.from({ length: TILE_COUNT }, (_, i) => ({
		slot: i,
		taskIndex: i % TASKS.length,
		phase: "running",
		cycle: 0,
	}));

function useWiredTiles() {
	const [tiles, setTiles] = useState<Tile[]>(initialTiles);
	const [reduced, setReduced] = useState(false);
	const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setReduced(true);
			setTiles((prev) => prev.map((t) => ({ ...t, phase: "done" })));
			return;
		}

		const pending = timers.current;
		const after = (ms: number, fn: () => void) => {
			const id = setTimeout(() => {
				pending.delete(id);
				fn();
			}, ms);
			pending.add(id);
		};

		const patch = (slot: number, next: (t: Tile) => Tile) =>
			setTiles((prev) => prev.map((t, i) => (i === slot ? next(t) : t)));

		const cycle = (slot: number) => {
			after(RUN_MIN_MS + Math.random() * RUN_JITTER_MS, () => {
				patch(slot, (t) => ({ ...t, phase: "done" }));

				after(DONE_HOLD_MS, () => {
					patch(slot, (t) => ({ ...t, phase: "exiting" }));

					after(EXIT_MS, () => {
						setTiles((prev) => {
							// Never show the same task twice at once.
							const onScreen = new Set(prev.map((t) => t.taskIndex));
							let next = Math.floor(Math.random() * TASKS.length);
							for (let n = 0; n < TASKS.length && onScreen.has(next); n++) {
								next = (next + 1) % TASKS.length;
							}
							return prev.map((t, i) =>
								i === slot
									? {
											...t,
											taskIndex: next,
											phase: "running" as const,
											cycle: t.cycle + 1,
										}
									: t,
							);
						});
						cycle(slot);
					});
				});
			});
		};

		for (let i = 0; i < TILE_COUNT; i++) cycle(i);

		return () => {
			for (const id of pending) clearTimeout(id);
			pending.clear();
		};
	}, []);

	return { tiles, reduced };
}

export function WiredGrid() {
	const { tiles, reduced } = useWiredTiles();

	return (
		<section
			/* Tight to the heading above it — this grid is that heading's content, and
			   a section-sized gap between the two made them read as separate bands. */
			className="relative mx-auto w-full max-w-[1348px] overflow-hidden pt-8 pb-[50px] sm:pt-10 sm:pb-20"
			id="features"
		>
			{/* Edge fades so reflowing tiles dissolve into the page rather than clipping. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-y-0 left-0 z-2 w-20 bg-[linear-gradient(to_right,var(--color-base)_20%,transparent)] sm:w-[200px]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-y-0 right-0 z-2 w-20 bg-[linear-gradient(to_left,var(--color-base)_20%,transparent)] sm:w-[200px]"
			/>

			<ul className="grid grid-cols-2 gap-1.5 px-4 sm:grid-cols-3 sm:gap-2 sm:px-6 lg:grid-cols-6">
				{tiles.map((tile) => {
					const task = TASKS[tile.taskIndex];
					const done = tile.phase === "done";

					return (
						<li
							key={tile.slot}
							style={
								tile.cycle === 0 && !reduced
									? { animationDelay: `${tile.slot * STAGGER_MS}ms` }
									: undefined
							}
							className={cn(
								// Explicit radii: `rounded-lg` resolves against shadcn's
								// `--radius: 0.75rem` here, which is 12px, not the 8px we want.
								"flex h-22 flex-col gap-2 rounded-[8px] border border-white/6 bg-white/3 p-3 sm:h-[110px] sm:gap-3 sm:rounded-[10px] sm:p-4",
								// The reference caps mobile at 10 tiles.
								"max-sm:[&:nth-child(n+11)]:hidden",
								tile.phase === "exiting" ? "tile-out" : "tile-in",
							)}
						>
							<div className="flex items-center gap-2 sm:gap-2.5">
								<BrandGlyph
									icon={task.icon}
									className="size-[22px] text-white/70 sm:size-7"
								/>
								<div className="flex min-w-0 flex-col gap-px">
									<span className="truncate font-medium text-[11px] text-white/70 sm:text-[12px]">
										{task.module}
									</span>
									<span className="truncate text-[10px] text-white/35 sm:text-[11px]">
										{task.detail}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-1.5">
								<span
									className={cn(
										"size-[5px] shrink-0 rounded-full sm:size-1.5",
										done ? "bg-sage" : "dot-pulse bg-brand",
									)}
								/>
								<span
									className={cn(
										"font-mono text-[9px] sm:text-[10px]",
										done ? "text-sage" : "text-white/30",
									)}
								>
									{done ? "Wired" : "Wiring"}
								</span>
							</div>

							<div className="h-0.5 overflow-hidden rounded-[1px] bg-white/6">
								<div
									className={cn(
										"h-full rounded-[1px] transition-[width] duration-400 ease-out",
										done ? "bg-sage" : "bg-white/15",
									)}
									style={{ width: done ? "100%" : "0%" }}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
