import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AFTER_SIGN_IN_HREF } from "@/components/auth/controls";
import { OnboardingSkeleton } from "@/components/console/skeletons";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { SIGN_IN_HREF } from "@/lib/brand";
import { type Answers, firstUnansweredStep, QUESTIONS } from "@/lib/onboarding";
import { pageHead } from "@/lib/seo";
import { getSupabase } from "@/lib/supabase";
import { explain, NO_ROW } from "@/lib/supabase-errors";

export const Route = createFileRoute("/onboarding")({
	head: () =>
		pageHead({
			path: "/onboarding",
			title: "Welcome",
			description:
				"A few questions so the console can fit what you are building.",
			noIndex: true,
		}),
	component: Onboarding,
});

type Loaded = {
	answers: Answers;
	step: number;
	userId: string;
	displayName: string | null;
};

/**
 * The wizard's host. It owns everything the wizard deliberately does not: who
 * is signed in, what they already answered, and where they go next.
 *
 * The session is read in the browser rather than a route loader because the
 * client that holds it is the browser client — a loader would run before the
 * cookie is readable on a fresh OAuth return and bounce people back to sign-in
 * a moment after they signed in.
 */
function Onboarding() {
	const [loaded, setLoaded] = useState<Loaded | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const supabase = getSupabase();

		(async () => {
			const { data: session } = await supabase.auth.getUser();
			const user = session.user;

			if (!user) {
				window.location.replace(SIGN_IN_HREF);
				return;
			}

			const { data: profile, error: failure } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.maybeSingle();

			/* No row yet is the normal first visit, not a failure. */
			if (failure && failure.code !== NO_ROW) {
				setError(explain(failure));
				return;
			}

			if (profile?.onboarded_at) {
				window.location.replace(AFTER_SIGN_IN_HREF);
				return;
			}

			const answers: Answers = {};
			for (const question of QUESTIONS) {
				const saved = profile?.[question.id];
				if (saved != null) answers[question.id] = saved;
			}

			setLoaded({
				answers,
				step: firstUnansweredStep(answers),
				userId: user.id,
				/* Whatever the provider already told us. No reason to ask again. */
				displayName:
					user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
			});
		})().catch((thrown: unknown) =>
			setError(
				thrown instanceof Error
					? thrown.message
					: "Could not load your account.",
			),
		);
	}, []);

	async function save(answers: Answers, notes: string) {
		if (!loaded) return;

		const { error: failure } = await getSupabase()
			.from("profiles")
			.upsert({
				id: loaded.userId,
				display_name: loaded.displayName,
				...answers,
				notes: notes || null,
				onboarded_at: new Date().toISOString(),
			});

		/* Thrown, not swallowed: the wizard shows what the save said. */
		if (failure) throw new Error(explain(failure));

		window.location.assign(AFTER_SIGN_IN_HREF);
	}

	if (error) {
		return (
			<AuthShell
				tagline="We could not load your account."
				title="Something broke"
			>
				<p className="text-[14px] text-white/60" role="alert">
					{error}
				</p>
			</AuthShell>
		);
	}

	if (!loaded) {
		return (
			<AuthShell size="wide" tagline="One moment." title="Getting set up">
				<OnboardingSkeleton />
			</AuthShell>
		);
	}

	return (
		<OnboardingWizard
			initialAnswers={loaded.answers}
			initialStep={loaded.step}
			onFinish={save}
		/>
	);
}
