import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StarterBuilder } from "@/components/starters/starter-builder";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { REPO_URL, SIGN_UP_HREF } from "@/lib/brand";
import { pageHead } from "@/lib/seo";
import {
	STARTER_QUESTIONS,
	type StarterAnswers,
	type StarterQuestionId,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

/**
 * The generator, in public.
 *
 * Everything the product does short of handing over the archive happens here
 * without an account: every question, the real files, the real source. The
 * account is asked for at the download, which is the moment something is
 * actually being given away.
 *
 * ## Why the answers live in the URL
 *
 * So a stack is a link. "Here is the thing I generated" is the only sentence
 * that has ever sold a generator, and it cannot be said about a page whose
 * state lives in React. Every answer is a search parameter, the server
 * canonicalises them, and what ends up in the address bar is a stack somebody
 * else can open.
 *
 * Nothing here is trusted. `sanitiseAnswers` on the server prunes whatever
 * arrives to something the wizard would have offered, so a hand-edited URL
 * gets a legal starter rather than an error or a stack that does not exist.
 */

const QUESTION_IDS = STARTER_QUESTIONS.map((question) => question.id);

/**
 * Search parameters, read as answers.
 *
 * Anything that is not a question is dropped, and every value is forced to a
 * string. The server decides whether an answer is *legal*; this only decides
 * whether it is shaped like one.
 */
function readAnswers(search: Record<string, unknown>): StarterAnswers {
	const answers: StarterAnswers = {};

	for (const id of QUESTION_IDS) {
		const value = search[id];

		if (typeof value === "string" && value !== "") answers[id] = value;
	}
	return answers;
}

export const Route = createFileRoute("/build")({
	validateSearch: (search: Record<string, unknown>) =>
		readAnswers(search) as Record<StarterQuestionId, string | undefined>,
	head: () =>
		pageHead({
			path: "/build",
			title: "Build a stack",
			description:
				"Pick your framework, database, ORM, auth, billing and email, and read every file the generator writes. No account needed.",
		}),
	component: BuildPage,
});

function BuildPage() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	/**
	 * The URL follows the build rather than leading it.
	 *
	 * `replace` so that changing six answers leaves one entry in the back
	 * stack instead of six — the back button should leave the page, not walk
	 * backwards through a stack somebody was assembling.
	 */
	function remember(answers: StarterAnswers) {
		navigate({
			replace: true,
			search: answers as Record<StarterQuestionId, string | undefined>,
		});
	}

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base pt-10 pb-20">
				<Container>
					<div className="flex flex-col gap-2">
						<p className="font-mono text-[12px] text-sage uppercase tracking-[0.12em]">
							Build a stack
						</p>
						<h1 className="max-w-[22ch] font-medium text-[34px] text-ink leading-[1.08] tracking-[-0.02em] sm:text-[42px]">
							Read the whole thing before you sign up.
						</h1>
						<p className="mt-1 max-w-[62ch] text-[15px] text-ink-soft leading-[1.6]">
							Every answer below changes the repository on the right — real
							files from the real generator, not a screenshot. An option that
							goes dim is one that cannot work with what you have already
							picked. Downloading the archive is the only part that needs an
							account.
						</p>
					</div>

					<div className="mt-9">
						<StarterBuilder
							initial={readAnswers(search)}
							onAnswersChange={remember}
						/>
					</div>

					<div className="mt-8 flex flex-wrap items-center gap-3">
						<a
							className={cn(
								buttonVariants({ variant: "primary" }),
								"rounded-[10px]",
							)}
							href={SIGN_UP_HREF}
						>
							Download this starter
						</a>
						<a
							className={cn(
								buttonVariants({ variant: "secondary" }),
								"rounded-[10px]",
							)}
							href={REPO_URL}
							rel="noreferrer"
							target="_blank"
						>
							Read our source
						</a>
						<p className="text-[13px] text-ink-muted">
							Free, and the repo you generate carries no licence from us.
						</p>
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}
