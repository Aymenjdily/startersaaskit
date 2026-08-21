import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";

/**
 * Section 10 — `uc-home-section`: breadth, stated cheaply.
 *
 * The reference design carries this section on device mockups. There is no
 * artwork in this repo and inventing some would make the one section about
 * "what you can build" the least honest thing on the page, so it is a plain
 * grid instead. Sections 05–09 are all animated; a still block here is also a
 * welcome change of pace before the closing CTA.
 *
 * Every card ends in a `proof` — a pnpm script or a file in this repo that
 * backs what the card just claimed. `use-cases.test.tsx` resolves all of them,
 * so a card cannot outlive the thing it points at.
 */

export type Proof =
	| { kind: "script"; value: string }
	| { kind: "file"; value: string };

export type UseCase = {
	title: string;
	text: string;
	proof: Proof;
};

export const USE_CASES: UseCase[] = [
	{
		title: "B2B SaaS",
		text: "Sign-in and cookie sessions are configured before you write anything, so the account model is the first thing you extend rather than the first thing you build.",
		proof: { kind: "file", value: "src/lib/auth.ts" },
	},
	{
		title: "Internal tools",
		text: "Typed queries over Postgres and a table browser you did not have to write. Most of these need a schema and a form, not a landing page.",
		proof: { kind: "script", value: "db:studio" },
	},
	{
		title: "Side projects",
		text: "No account to create and no key to paste before it runs. The database provisions itself on the first start, so the afternoon goes to the idea.",
		proof: { kind: "file", value: "neon-vite-plugin.ts" },
	},
	{
		title: "Client work",
		text: "Strict TypeScript and a suite that is already green, so what you hand over has a baseline the next person can check for themselves.",
		proof: { kind: "script", value: "test" },
	},
	{
		title: "AI-assisted builds",
		text: "The conventions are written down and every module has a spec beside it, so when an agent writes the next feature something already exists to catch it.",
		proof: { kind: "file", value: ".cursorrules" },
	},
	{
		title: "Learning the stack",
		text: "Every layer is a file you can open. Routing, data access and the schema are each short enough to read start to finish before you change them.",
		proof: { kind: "file", value: "src/router.tsx" },
	},
];

const proofLabel = (proof: Proof) =>
	proof.kind === "script" ? `pnpm ${proof.value}` : proof.value;

export function UseCases() {
	return (
		<Section tone="forest">
			<Container>
				<FadeUp className="mb-12 md:mb-14">
					<SectionHeading
						align="center"
						eyebrow="Use cases"
						title="The same starting point, whatever you are building"
						description="Nothing here is a vertical template. It is the plumbing every one of these needs, already wired and already tested."
					/>
				</FadeUp>

				<div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" data-cases>
					{USE_CASES.map((useCase, i) => (
						<FadeUp
							className="flex flex-col gap-3 rounded-[14px] border border-white/6 bg-white/3 p-5 transition-colors duration-300 hover:border-white/12 sm:p-6"
							key={useCase.title}
							step={(i % 4) as 0 | 1 | 2 | 3}
						>
							<h3 className="text-[17px] font-medium tracking-[-0.01em] text-ink">
								{useCase.title}
							</h3>
							<p className="flex-1 text-[14px] leading-[1.55] text-ink-muted">
								{useCase.text}
							</p>
							<code className="mt-1 self-start rounded-[5px] border border-line-bright bg-base px-2 py-0.5 font-mono text-[12px] text-ink-soft">
								{proofLabel(useCase.proof)}
							</code>
						</FadeUp>
					))}
				</div>
			</Container>
		</Section>
	);
}
