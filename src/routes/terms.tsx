import { createFileRoute } from "@tanstack/react-router";
import { Clause, LegalPage, Points } from "@/components/legal/legal-page";
import { BRAND } from "@/lib/brand";
import { GOVERNING_LAW, LEGAL_CONTACT, TERMS_UPDATED } from "@/lib/legal";
import { GENERATION_LIMIT } from "@/lib/quota";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
	head: () =>
		pageHead({
			path: "/terms",
			title: "Terms",
			description: `The terms of using ${BRAND}, including what you own in the code it generates.`,
		}),
	component: Terms,
});

function Terms() {
	return (
		<LegalPage
			intro={`These terms cover using ${BRAND}. The short version: the code it generates is yours outright, the service is free while in beta, and it comes with no warranty — read the code before you put it in production.`}
			title="Terms"
			updated={TERMS_UPDATED}
		>
			<Clause id="what-this-is" title="What this is">
				<p>
					{BRAND} asks you a series of questions and assembles a starter
					repository from the answers, which you download as a zip. It is a code
					generator. It does not host your application, and it does not have
					access to any account of yours beyond the email address you signed up
					with.
				</p>
			</Clause>

			<Clause id="your-account" title="Your account">
				<Points
					items={[
						"One account per person. Keep your credentials to yourself — anything done through your account is treated as done by you.",
						"You must be old enough to enter a contract where you live.",
						"You can close your account at any time by emailing us.",
					]}
				/>
			</Clause>

			<Clause id="what-it-costs" title="What it costs">
				<p>
					Nothing, while it is in beta. Each account gets {GENERATION_LIMIT}{" "}
					generations. Downloading a starter you have already generated is
					always free and does not count against that.
				</p>
				<p>
					The limit may change, and paid plans may arrive later. If we ever
					start charging, it will be for new purchases — we will not bill you
					for an account you already have without asking you first.
				</p>
			</Clause>

			<Clause id="what-you-own" title="What you own">
				<p>
					<strong className="text-ink">
						The code we generate for you is yours.
					</strong>{" "}
					No licence back to us, no attribution required, no restriction on
					commercial use. Ship it, sell it, rewrite it, delete it.
				</p>
				<p>
					The generated project pulls in third-party packages — React, your
					chosen database driver, and so on — and each of those carries its own
					licence from its own authors. Those are between you and them; we
					neither grant nor restrict anything there.
				</p>
			</Clause>

			<Clause id="what-we-own" title="What we own">
				<p>
					{BRAND} itself — the site, the generator, the name and the mark —
					stays ours. Using the service does not transfer any of it, and the
					output being yours does not make the machine yours.
				</p>
			</Clause>

			<Clause id="no-warranty" title="What we do not promise">
				<Points
					items={[
						"This is beta software. There is no uptime commitment, and features may change or be withdrawn.",
						"Generated code is provided as is. It is tested, but it is a starting point and not an audited production system — review it, run its suite, and satisfy yourself before you deploy it.",
						"We are not responsible for what you build with it, or for anything that happens in the accounts and services you connect it to.",
					]}
				/>
			</Clause>

			<Clause id="fair-use" title="Using it fairly">
				<Points
					items={[
						"Do not try to get around the generation limit — extra accounts, automated sign-ups, or anything similar.",
						"Do not hammer the API or attempt to disrupt the service for other people.",
						"Do not resell access to the generator itself. Selling what you build with the output is entirely fine.",
					]}
				/>
				<p>
					If an account is clearly doing one of these, we may suspend it. We
					will tell you why.
				</p>
			</Clause>

			<Clause id="liability" title="Liability">
				<p>
					Nothing here limits liability for anything that cannot lawfully be
					limited — death or personal injury caused by negligence, or fraud.
					Beyond that, and because the service is currently free, our total
					liability to you is limited to the amount you have paid us, which is
					nothing.
				</p>
			</Clause>

			<Clause id="ending" title="Ending it">
				<p>
					You can stop using {BRAND} whenever you like, and ask us to delete
					your account. We may close an account that breaches these terms.
					Either way, starters you have already downloaded remain yours.
				</p>
			</Clause>

			<Clause id="changes" title="Changes">
				<p>
					We will update the date at the top when these terms change, and email
					account holders if a change materially affects them.
				</p>
			</Clause>

			<Clause id="law" title="Governing law">
				<p>
					These terms are governed by the laws of {GOVERNING_LAW}, and its
					courts have exclusive jurisdiction over any dispute arising from them.
				</p>
			</Clause>

			<Clause id="contact" title="Contact">
				<p>
					<a
						className="text-ink underline underline-offset-4"
						href={`mailto:${LEGAL_CONTACT}`}
					>
						{LEGAL_CONTACT}
					</a>
				</p>
			</Clause>
		</LegalPage>
	);
}
