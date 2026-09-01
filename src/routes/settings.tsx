import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { Field } from "@/components/auth/controls";
import { Avatar } from "@/components/console/avatar";
import { ConsoleShell } from "@/components/console/console-shell";
import { Panel, Section } from "@/components/console/panel";
import { SettingsSkeleton } from "@/components/console/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteOwnAccount, updateDisplayName } from "@/lib/account";
import { avatarFor, displayNameFor, SETTINGS_HREF } from "@/lib/console-nav";
import { answerLabels, QUESTIONS } from "@/lib/onboarding";
import { pageHead } from "@/lib/seo";
import { getSupabase } from "@/lib/supabase";
import { explain, NO_ROW } from "@/lib/supabase-errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
	head: () =>
		pageHead({
			path: "/settings",
			title: "Settings",
			description: "Your account, your onboarding answers, and how to leave.",
			noIndex: true,
		}),
	component: SettingsPage,
});

type Loaded = {
	email: string | null;
	name: string;
	avatar: string | null;
	/** Raw `profiles` row — read by question id via `answerLabels`, not typed column by column. */
	answers: Record<string, unknown>;
};

/**
 * Account basics, a read-only summary of onboarding, and the one irreversible
 * action on the page.
 *
 * Loaded independently of `ConsoleShell`, the same way every other console
 * page reads its own session — the shell does not expose the user it already
 * fetched, so a second `getUser()` is the established cost of that, not an
 * oversight here.
 */
function SettingsPage() {
	const [loaded, setLoaded] = useState<Loaded | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	useEffect(() => {
		const supabase = getSupabase();

		(async () => {
			const { data } = await supabase.auth.getUser();
			const user = data.user;
			if (!user) return;

			const { data: profile, error: failure } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", user.id)
				.maybeSingle();

			/* No row yet is a real account that has not answered anything, not a
			   failure — every field below just reads as "not answered". */
			if (failure && failure.code !== NO_ROW) {
				setError(explain(failure));
				return;
			}

			const currentName = displayNameFor(user);
			setLoaded({
				email: user.email ?? null,
				name: currentName,
				avatar: avatarFor(user),
				answers: profile ?? {},
			});
			setName(currentName);
		})().catch((thrown: unknown) =>
			setError(
				thrown instanceof Error
					? thrown.message
					: "Could not load your account.",
			),
		);
	}, []);

	async function saveName(event: FormEvent) {
		event.preventDefault();
		const trimmed = name.trim();
		if (!loaded || trimmed.length === 0 || trimmed === loaded.name) return;

		setSaving(true);
		setSaveError(null);
		setSaved(false);
		try {
			await updateDisplayName(trimmed);
			setLoaded((current) =>
				current ? { ...current, name: trimmed } : current,
			);
			setSaved(true);
		} catch (thrown) {
			setSaveError(
				thrown instanceof Error ? thrown.message : "Could not save that.",
			);
		} finally {
			setSaving(false);
		}
	}

	async function confirmDelete() {
		setDeleting(true);
		setDeleteError(null);
		try {
			await deleteOwnAccount();
			/* The account is already gone at this point — a failure here is the
			   session cleaning up after itself, not a reason to stop leaving. */
			try {
				await getSupabase().auth.signOut();
			} catch {
				/* Nothing left to sign out of on the server; the redirect below
				   clears the client side regardless. */
			}
			window.location.assign("/");
		} catch (thrown) {
			setDeleteError(
				thrown instanceof Error
					? thrown.message
					: "Could not delete your account.",
			);
			setDeleting(false);
		}
	}

	return (
		<ConsoleShell currentPath={SETTINGS_HREF} title="Settings">
			{error ? (
				<p className="text-[13px] text-diagram-red" role="alert">
					{error}
				</p>
			) : !loaded ? (
				<SettingsSkeleton />
			) : (
				<div className="flex flex-col gap-10">
					<Section
						description="What the console — and anyone you invite — sees."
						title="Account"
					>
						<Panel className="flex flex-col gap-5 p-5">
							<div className="flex items-center gap-4">
								<Avatar
									className="size-14 text-[16px]"
									name={loaded.name}
									src={loaded.avatar}
								/>
								<div className="min-w-0">
									<p className="truncate font-medium text-[15px] text-ink">
										{loaded.name}
									</p>
									<p className="truncate text-[13px] text-ink-muted">
										{loaded.email ?? "No email on file"}
									</p>
								</div>
							</div>

							<form
								className="flex max-w-[420px] flex-col gap-3"
								onSubmit={saveName}
							>
								<Field
									autoComplete="name"
									label="Display name"
									name="name"
									onChange={(value) => {
										setName(value);
										setSaved(false);
									}}
									placeholder="Your name"
									type="text"
									value={name}
								/>

								{saveError && (
									<p className="text-[13px] text-diagram-red" role="alert">
										{saveError}
									</p>
								)}

								<div className="flex items-center gap-3">
									<button
										className={cn(
											buttonVariants({ variant: "primary", size: "sm" }),
											"rounded-[8px]",
										)}
										disabled={
											saving ||
											name.trim().length === 0 ||
											name.trim() === loaded.name
										}
										type="submit"
									>
										{saving ? "Saving…" : "Save name"}
									</button>
									{saved && <p className="text-[12px] text-sage">Saved.</p>}
								</div>
							</form>
						</Panel>
					</Section>

					<Section
						action={
							<a
								className="text-[13px] text-ink-muted underline underline-offset-4 transition-colors duration-200 hover:text-ink"
								href="/onboarding?edit=1"
							>
								Edit answers
							</a>
						}
						description="What you told us during onboarding. Answers here decide what the console shows first, not what the generator will offer you — every combination stays on the table regardless."
						title="Your answers"
					>
						<Panel>
							<dl className="divide-y divide-white/8">
								{QUESTIONS.map((question) => {
									const labels = answerLabels(
										question,
										loaded.answers[question.id],
									);

									return (
										<div
											className="flex items-center justify-between gap-4 px-5 py-3.5"
											key={question.id}
										>
											<dt className="text-[13px] text-ink-muted">
												{question.prompt}
											</dt>
											<dd className="text-right text-[13px] text-ink">
												{labels.length > 0 ? labels.join(", ") : "Not answered"}
											</dd>
										</div>
									);
								})}
							</dl>
						</Panel>
					</Section>

					<Section
						description="This is the only thing on this page that cannot be undone."
						title="Danger zone"
					>
						<Panel className="flex flex-col items-start gap-4 border-diagram-red/25 p-5 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-[14px] text-ink">Delete your account</p>
								<p className="mt-1 max-w-[48ch] text-[13px] text-ink-muted">
									Every starter you have generated, your onboarding answers, and
									your sign-in are gone for good. Feedback you left stays,
									unlinked from your name.
								</p>
							</div>
							<button
								className={cn(
									buttonVariants({ variant: "secondary", size: "sm" }),
									"shrink-0 rounded-[8px] border-diagram-red/40 text-diagram-red hover:border-diagram-red hover:text-diagram-red",
								)}
								onClick={() => setConfirmingDelete(true)}
								type="button"
							>
								Delete account
							</button>
						</Panel>
					</Section>
				</div>
			)}

			<Dialog
				description="This cannot be undone. Every starter you have generated and your onboarding answers are deleted along with your sign-in."
				dismissOnBackdrop={!deleting}
				onClose={() => setConfirmingDelete(false)}
				open={confirmingDelete}
				title="Delete your account?"
			>
				<div className="flex flex-col gap-3">
					{deleteError && (
						<p className="text-[13px] text-diagram-red" role="alert">
							{deleteError}
						</p>
					)}
					<div className="flex items-center gap-3">
						<button
							className={cn(
								buttonVariants({ variant: "secondary" }),
								"h-10 rounded-[8px]",
							)}
							disabled={deleting}
							onClick={() => setConfirmingDelete(false)}
							type="button"
						>
							Keep my account
						</button>

						<button
							className={cn(
								buttonVariants({ variant: "primary" }),
								"h-10 flex-1 rounded-[8px] bg-diagram-red text-ink",
							)}
							disabled={deleting}
							onClick={confirmDelete}
							type="button"
						>
							{deleting ? "Deleting…" : "Delete it"}
						</button>
					</div>
				</div>
			</Dialog>
		</ConsoleShell>
	);
}
