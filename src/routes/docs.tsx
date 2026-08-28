import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { BrandGlyph } from "@/components/landing/brand-glyph";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/ui/container";
import { NeutralGlyph } from "@/components/ui/option-cards";
import { SIGN_UP_HREF } from "@/lib/brand";
import { DEFAULT_GENERATION_LIMIT } from "@/lib/quota";
import { pageHead } from "@/lib/seo";
import {
	QUESTION_COUNT_WORD,
	STARTER_QUESTIONS,
} from "@/lib/starter-questions";

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
 * One headed block of the page. The id is the anchor a link can point at and
 * is stable across edits, for the same reason a legal clause's is.
 */
function DocSection({
	children,
	id,
	title,
}: {
	children: React.ReactNode;
	id: string;
	title: string;
}) {
	return (
		<section className="scroll-mt-28" id={id}>
			<h2 className="text-[20px] font-medium tracking-[-0.01em] text-ink">
				{title}
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

export function Docs() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base pt-[140px] pb-24 md:pt-[180px]">
				<Container>
					<div className="max-w-[68ch]">
						<h1 className="heading-tight text-h3 text-ink">Docs</h1>

						<p className="mt-8 text-body-lg leading-[1.6] text-ink-soft">
							Everything here describes the product as it runs today. The
							questions and options below are read from the same catalogue the
							wizard asks from, so this page cannot drift ahead of what the
							generator actually offers.
						</p>

						<div className="mt-12 flex flex-col gap-10">
							<DocSection id="quickstart" title="Quickstart">
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
										Answer the {QUESTION_COUNT_WORD} questions. Each one narrows
										the next, so a combination that cannot build is never
										offered.
									</li>
									<li>
										Open the starter in your console and download the zip.
									</li>
									<li>Unpack it, then inside the folder:</li>
								</ol>
								<ul className="flex flex-col gap-2 rounded-[10px] border border-line bg-elevated px-4 py-3.5">
									<Command>pnpm install</Command>
									<Command>pnpm test</Command>
									<Command>pnpm dev</Command>
								</ul>
								<p>
									Use whichever package manager you answered with — the commands
									above are the pnpm spelling, and the generated README carries
									yours.
								</p>
							</DocSection>

							<DocSection id="questions" title="The questions">
								<p>
									{QUESTION_COUNT_WORD.charAt(0).toUpperCase() +
										QUESTION_COUNT_WORD.slice(1)}{" "}
									questions, in order. Options that depend on an earlier answer
									— an ORM on the database, Neon Auth on Neon — appear only when
									that answer allows them.
								</p>
								<div className="mt-2 flex flex-col gap-4">
									{STARTER_QUESTIONS.map((question, i) => (
										<div
											className="rounded-[12px] border border-white/10 bg-elevated p-4"
											key={question.id}
										>
											<p className="flex items-baseline gap-2.5">
												<span className="font-mono text-[12px] text-ink-muted">
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

							<DocSection id="allowance" title="Your allowance">
								<p>
									Every account starts with {DEFAULT_GENERATION_LIMIT}{" "}
									generations. The counter is spent when the starter is created
									and only moves one way — deleting a starter does not hand a
									generation back, because the work already happened.
								</p>
								<p>
									Re-downloading a starter you already generated is always free.
								</p>
							</DocSection>

							<DocSection id="the-zip" title="What the zip contains">
								<p>
									The whole repository, ready to push: the application wired to
									your answers, a spec file beside every module, strict
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
									bug in the generator — report it from the console and we will
									fix the template, not just your copy.
								</p>
							</DocSection>

							<DocSection id="deploying" title="Deploying">
								<p>
									Where it deploys is the one question the wizard does not ask,
									so no hosting config ships in the zip. The repo runs anywhere
									your framework runs: a Next.js starter deploys to Vercel or
									Netlify as-is, a TanStack Start starter deploys through Nitro
									to the same hosts, and a React + Vite starter is a static
									build any static host can serve.
								</p>
							</DocSection>
						</div>
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
