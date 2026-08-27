import { createFileRoute } from "@tanstack/react-router";
import { Clause, LegalPage, Points } from "@/components/legal/legal-page";
import { BRAND } from "@/lib/brand";
import { LEGAL_CONTACT, PRIVACY_UPDATED, SUBPROCESSORS } from "@/lib/legal";
import { GENERATION_LIMIT } from "@/lib/quota";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
	head: () =>
		pageHead({
			path: "/privacy",
			title: "Privacy",
			description: `What ${BRAND} collects, why, and how to get it deleted.`,
		}),
	component: Privacy,
});

function Privacy() {
	return (
		<LegalPage
			intro={`${BRAND} collects the little it needs to run your account and generate your starters. There is no analytics, no advertising, and nothing is sold or shared beyond the two companies named below.`}
			title="Privacy"
			updated={PRIVACY_UPDATED}
		>
			<Clause id="what-we-collect" title="What we collect">
				<p>Four things, and nothing else:</p>
				<Points
					items={[
						<>
							<strong className="text-ink">Your account.</strong> Your email
							address. If you sign in with Google, they also confirm your name
							and profile picture to us.
						</>,
						<>
							<strong className="text-ink">Your onboarding answers.</strong>{" "}
							What you are building, your team size, your timeline, what usually
							slows you down, and how you heard about us. Every one is optional
							to be accurate about, and you can change them later.
						</>,
						<>
							<strong className="text-ink">Your starters.</strong> The answers
							you chose and the name you gave each repository, so the console
							can list them and let you download them again.
						</>,
						<>
							<strong className="text-ink">Anything you report.</strong> When
							you send a bug report we store what you wrote, the page you were
							on, and your browser&rsquo;s user-agent string — so we can
							reproduce the problem rather than ask you to describe your setup.
						</>,
					]}
				/>
			</Clause>

			<Clause id="what-we-do-not" title="What we do not do">
				<Points
					items={[
						"No analytics, no tracking pixels, no session recording. The site loads no third-party scripts at all.",
						"No advertising, and no sharing or selling your data to anyone.",
						"No payment details. Nothing is charged, so nothing is collected.",
						"No email marketing. We only email you about your account.",
					]}
				/>
			</Clause>

			<Clause id="why" title="Why we hold it">
				<Points
					items={[
						"To run your account and sign you in.",
						`To generate starters and let you download them again — including counting the ${GENERATION_LIMIT} generations each account gets.`,
						"To fix problems you report.",
						"To understand who the product is for. The onboarding answers exist for this and nothing else.",
					]}
				/>
			</Clause>

			<Clause id="who-else" title="Who else handles it">
				<p>Two companies, both as processors acting on our instructions:</p>
				<Points
					items={SUBPROCESSORS.map((one) => (
						<>
							<strong className="text-ink">{one.name}.</strong> {one.does}{" "}
							{one.holds}
						</>
					))}
				/>
			</Clause>

			<Clause id="cookies" title="Cookies">
				<p>
					One, and it is the sign-in session. It exists so you stay signed in
					between visits, it is set only after you sign in, and clearing it
					signs you out. There are no analytics or advertising cookies, which is
					why you are not being asked to consent to any.
				</p>
			</Clause>

			<Clause id="how-long" title="How long we keep it">
				<p>
					Your account and its data stay until you ask us to delete them. Bug
					reports outlive the account that filed them, with the link to you
					removed — we keep the description of the problem, not who reported it.
				</p>
			</Clause>

			<Clause id="your-rights" title="Your rights">
				<p>
					You can ask for a copy of what we hold, a correction, or a deletion.
					Email{" "}
					<a
						className="text-ink underline underline-offset-4"
						href={`mailto:${LEGAL_CONTACT}`}
					>
						{LEGAL_CONTACT}
					</a>{" "}
					and we will action it. Deletion removes your account, your onboarding
					answers and your starter records; already-downloaded zips are on your
					machine and are yours to keep.
				</p>
				<p>
					If you are in the UK or EU, these are your rights under UK GDPR and
					GDPR respectively, and you may also complain to your local data
					protection authority.
				</p>
			</Clause>

			<Clause id="children" title="Children">
				<p>
					This is a developer tool and is not directed at children. We do not
					knowingly collect anything from anyone under 16.
				</p>
			</Clause>

			<Clause id="changes" title="Changes">
				<p>
					If this policy changes in a way that affects what we collect or who
					handles it, we will update the date at the top and email account
					holders before it takes effect.
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
