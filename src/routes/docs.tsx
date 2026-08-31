import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { BrandGlyph } from "@/components/landing/brand-glyph";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/ui/container";
import { NeutralGlyph } from "@/components/ui/option-cards";
import { REPO_URL, SIGN_UP_HREF } from "@/lib/brand";
import { DEFAULT_GENERATION_LIMIT } from "@/lib/quota";
import { pageHead } from "@/lib/seo";
import {
	QUESTION_COUNT_WORD,
	STARTER_QUESTIONS,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs")({
	head: () =>
		pageHead({
			path: "/docs",
			title: "Docs",
			description:
				"How StarterSaaSKit works: the questions, the quota, what the zip contains, and what to run first.",
		}),
	component: Docs,
});

/**
 * The page's outline, and the only place it is written down. Both navs below
 * are built from this, and every `<DocSection>` looks its own title up here
 * rather than repeating it — so the sidebar, the mobile pill row and the
 * heading a reader actually scrolls to cannot say three different things.
 */
const SECTIONS = [
	{ id: "quickstart", title: "Quickstart" },
	{ id: "questions", title: "The questions" },
	{ id: "allowance", title: "Your allowance" },
	{ id: "the-zip", title: "What the zip contains" },
	{ id: "deploying", title: "Deploying" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function sectionTitle(id: SectionId): string {
	return SECTIONS.find((s) => s.id === id)?.title ?? id;
}

/**
 * Which section a reader is looking at, for the sidebar to highlight.
 *
 * The band is well above centre (`-15% … -70%`) rather than the middle of the
 * viewport: a heading only has to cross into the top fifth of the screen to
 * count as "current", which is where a reader's eye actually lands after a
 * scroll, not where the screen happens to be tallest.
 *
 * Starts on the first section so server and client agree before this effect
 * ever runs, the same reason every cycling section on the landing page starts
 * at index 0.
 */
function useActiveSection(ids: readonly SectionId[]): SectionId {
	const [active, setActive] = useState<SectionId>(ids[0]);

	useEffect(() => {
		const sections = ids
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);
		if (sections.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((e) => e.isIntersecting);
				if (visible.length > 0) {
					setActive(visible[0].target.id as SectionId);
				}
			},
			{ rootMargin: "-15% 0px -70% 0px" },
		);

		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	}, [ids]);

	return active;
}

/** The sticky "on this page" rail, shown once there is room beside the copy. */
function DocsSidebar({ active }: { active: SectionId }) {
	return (
		<nav aria-label="On this page" className="hidden lg:block">
			<div className="sticky top-[112px] flex flex-col gap-0.5">
				{SECTIONS.map((s) => (
					<a
						aria-current={active === s.id ? "location" : undefined}
						className={cn(
							"rounded-[8px] px-3 py-1.5 text-[13px] transition-colors duration-200",
							active === s.id
								? "bg-brand-dim text-brand"
								: "text-ink-muted hover:bg-white/5 hover:text-ink-soft",
						)}
						href={`#${s.id}`}
						key={s.id}
					>
						{s.title}
					</a>
				))}
				<a
					className="mt-5 flex items-center gap-1 border-line border-t pt-4 text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink-soft"
					href={`${REPO_URL}/blob/main/src/routes/docs.tsx`}
					rel="noreferrer"
					target="_blank"
				>
					Edit this page
					<span aria-hidden="true">↗</span>
				</a>
			</div>
		</nav>
	);
}

/** The same outline as a horizontal scroller, for widths with no room for a rail. */
function MobileDocsNav() {
	return (
		<nav
			aria-label="On this page"
			className="-mx-gutter mt-8 flex gap-2 overflow-x-auto px-gutter pb-1 lg:hidden"
		>
			{SECTIONS.map((s) => (
				<a
					className="shrink-0 rounded-full border border-white/10 bg-elevated px-3.5 py-1.5 text-[13px] text-ink-soft transition-colors duration-200 hover:border-white/20"
					href={`#${s.id}`}
					key={s.id}
				>
					{s.title}
				</a>
			))}
		</nav>
	);
}

/**
 * One headed block of the page. The id is the anchor a link can point at and
 * is stable across edits, for the same reason a legal clause's is.
 */
function DocSection({
	children,
	id,
}: {
	children: React.ReactNode;
	id: SectionId;
}) {
	return (
		<section className="scroll-mt-28" id={id}>
			<h2 className="text-[20px] font-medium tracking-[-0.01em] text-ink">
				{sectionTitle(id)}
			</h2>
			<div className="mt-3 flex flex-col gap-3 text-[15px] leading-[1.7] text-ink-soft">
				{children}
			</div>
		</section>
	);
}

/** A command row in the quickstart: the prompt is decorative, the rest is not. */
function Command({ children }: { children: string }) {
	return (
		<li className="flex items-baseline gap-3 font-mono text-[13px]">
			<span aria-hidden="true" className="shrink-0 text-sage">
				$
			</span>
			<span className="text-ink">{children}</span>
		</li>
	);
}

/**
 * Copies every command in the block at once, joined by newline — a reader
 * pastes the whole quickstart into a terminal in one go rather than three.
 * Falls back to doing nothing but leaving the text selectable if the
 * clipboard API is unavailable or the permission is denied.
 */
function CopyCommands({ commands }: { commands: string[] }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(commands.join("\n"));
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch {
			/* Clipboard denied or unavailable — the commands are still
			   selectable text, so nothing a reader needs is actually lost. */
		}
	}

	return (
		<button
			className="flex shrink-0 items-center gap-1.5 self-start rounded-[6px] border border-white/10 px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors duration-200 hover:border-white/20 hover:text-ink-soft"
			onClick={copy}
			type="button"
		>
			{copied ? (
				<Check aria-hidden="true" className="size-3.5 text-sage" />
			) : (
				<Copy aria-hidden="true" className="size-3.5" />
			)}
			{copied ? "Copied" : "Copy"}
		</button>
	);
}

export function Docs() {
	const active = useActiveSection(SECTIONS.map((s) => s.id));
	const quickstartCommands = ["pnpm install", "pnpm test", "pnpm dev"];

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base pt-[140px] pb-24 md:pt-[180px]">
				<Container>
					<div className="lg:grid lg:grid-cols-[200px_minmax(0,68ch)] lg:gap-16">
						<DocsSidebar active={active} />

						<div>
							<h1 className="heading-tight text-h3 text-ink">Docs</h1>

							<p className="mt-8 text-body-lg leading-[1.6] text-ink-soft">
								Everything here describes the product as it runs today. The
								questions and options below are read from the same catalogue the
								wizard asks from, so this page cannot drift ahead of what the
								generator actually offers.
							</p>

							<MobileDocsNav />

							<div className="mt-12 flex flex-col gap-10">
								<DocSection id="quickstart">
									<ol className="flex list-decimal flex-col gap-2 pl-5">
										<li>
											<a
												className="text-ink underline underline-offset-4"
												href={SIGN_UP_HREF}
											>
												Create your account
											</a>{" "}
											— email, or Google.
										</li>
										<li>
											Answer the {QUESTION_COUNT_WORD} questions. Each one
											narrows the next, so a combination that cannot build is
											never offered.
										</li>
										<li>
											Open the starter in your console and download the zip.
										</li>
										<li>Unpack it, then inside the folder:</li>
									</ol>
									<div className="flex items-start justify-between gap-3 rounded-[10px] border border-line bg-elevated px-4 py-3.5">
										<ul className="flex flex-col gap-2">
											{quickstartCommands.map((command) => (
												<Command key={command}>{command}</Command>
											))}
										</ul>
										<CopyCommands commands={quickstartCommands} />
									</div>
									<p>
										Use whichever package manager you answered with — the
										commands above are the pnpm spelling, and the generated
										README carries yours.
									</p>
								</DocSection>

								<DocSection id="questions">
									<p>
										{QUESTION_COUNT_WORD.charAt(0).toUpperCase() +
											QUESTION_COUNT_WORD.slice(1)}{" "}
										questions, in order. Options that depend on an earlier
										answer — an ORM on the database, Neon Auth on Neon — appear
										only when that answer allows them.
									</p>
									<div className="relative mt-2 flex flex-col gap-4">
										{/* The line the numbers below sit on — "each one narrows
										    the next" as a visual, not just a sentence above. */}
										<div
											aria-hidden="true"
											className="absolute top-1 bottom-1 left-[27px] w-px bg-line"
										/>
										{STARTER_QUESTIONS.map((question, i) => (
											<div
												className="relative rounded-[12px] border border-white/10 bg-elevated p-4"
												key={question.id}
											>
												<p className="flex items-baseline gap-2.5">
													<span className="relative z-10 font-mono text-[12px] text-ink-muted">
														{String(i + 1).padStart(2, "0")}
													</span>
													<span className="font-medium text-[15px] text-ink">
														{question.label}
													</span>
												</p>
												<p className="mt-1 text-[14px] text-ink-muted">
													{question.prompt}
												</p>
												{question.options ? (
													<div className="mt-3 flex flex-wrap gap-2">
														{question.options.map((option) => (
															<span
																className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-black/25 px-2.5 py-1.5 text-[13px] text-white/80"
																key={option.id}
															>
																{option.icon ? (
																	<BrandGlyph
																		className="size-3.5 text-white/70"
																		icon={option.icon}
																	/>
																) : (
																	<NeutralGlyph className="size-3.5 text-white/70" />
																)}
																{option.label}
															</span>
														))}
													</div>
												) : (
													<p className="mt-3 font-mono text-[13px] text-ink-muted">
														Free text — {question.hint?.toLowerCase()}
													</p>
												)}
											</div>
										))}
									</div>
								</DocSection>

								<DocSection id="allowance">
									<p>
										Every account starts with {DEFAULT_GENERATION_LIMIT}{" "}
										generations. The counter is spent when the starter is
										created and only moves one way — deleting a starter does not
										hand a generation back, because the work already happened.
									</p>
									<p>
										Re-downloading a starter you already generated is always
										free.
									</p>
								</DocSection>

								<DocSection id="the-zip">
									<p>
										The whole repository, ready to push: the application wired
										to your answers, a spec file beside every module, strict
										TypeScript and Biome already configured, an{" "}
										<code className="font-mono text-[13px] text-ink">
											.env.example
										</code>{" "}
										listing every variable the app reads, and an{" "}
										<code className="font-mono text-[13px] text-ink">
											AGENTS.md
										</code>{" "}
										so an assistant opening the repo knows its shape.
									</p>
									<p>
										The suite is green on the first run. If it is not, that is a
										bug in the generator — report it from the console and we
										will fix the template, not just your copy.
									</p>
								</DocSection>

								<DocSection id="deploying">
									<p>
										Where it deploys is the one question the wizard does not
										ask, so no hosting config ships in the zip. The repo runs
										anywhere your framework runs: a Next.js starter deploys to
										Vercel or Netlify as-is, a TanStack Start starter deploys
										through Nitro to the same hosts, and a React + Vite starter
										is a static build any static host can serve.
									</p>
								</DocSection>
							</div>
						</div>
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
