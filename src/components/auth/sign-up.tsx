import { type FormEvent, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { SIGN_IN_HREF } from "@/lib/brand";
import { QUESTION_COUNT_WORD_CAPITALISED } from "@/lib/starter-questions";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AuthShell } from "./auth-shell";
import {
	AFTER_SIGN_IN_HREF,
	CALLBACK_PATH,
	Divider,
	Field,
	FormError,
	PasswordField,
	ProviderButtons,
} from "./controls";

/**
 * The shortest password this form will send. Supabase's own floor is lower, so
 * this is the page's rule and the page enforces it — the hint under the field
 * would otherwise be a claim nothing checks.
 */
export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters.`;

export function SignUp() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (password.length < MIN_PASSWORD_LENGTH) {
			setError(PASSWORD_HINT);
			return;
		}

		setPending(true);

		try {
			const { data, error: failure } = await getSupabase().auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${window.location.origin}${CALLBACK_PATH}`,
				},
			});

			if (failure) {
				setError(failure.message);
				return;
			}

			/**
			 * With email confirmation on, Supabase returns a user and no session,
			 * and it returns exactly that for an address that already has an
			 * account — deliberately, so the form cannot be used to find out who
			 * has one. Both land here, which is the point: this page must not be
			 * able to tell them apart either.
			 */
			if (data.session) {
				window.location.assign(AFTER_SIGN_IN_HREF);
				return;
			}
			setSent(true);
		} catch (thrown) {
			setError(
				thrown instanceof Error ? thrown.message : "Could not sign you up.",
			);
		} finally {
			setPending(false);
		}
	}

	if (sent) {
		return (
			<AuthShell
				tagline="Confirm your address and the console opens."
				title="Check your inbox"
			>
				<div className="flex flex-col gap-6">
					<p className="text-[14px] leading-[1.6] text-ink-muted">
						If that address can be signed up, a confirmation link is on its way
						to <span className="text-ink">{email}</span>. Open it and you are
						in.
					</p>

					<a
						className={cn(
							buttonVariants({ variant: "primary" }),
							"h-11 rounded-[8px]",
						)}
						href={SIGN_IN_HREF}
					>
						Back to sign in
					</a>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell
			tagline={`${QUESTION_COUNT_WORD_CAPITALISED} answers and the repo is in your GitHub.`}
			title="Create your account"
		>
			<div className="flex flex-col gap-6">
				<ProviderButtons onError={setError} verb="Sign up" />

				<Divider />

				<form className="flex flex-col gap-4" noValidate onSubmit={submit}>
					<Field
						autoComplete="email"
						label="Email address"
						name="email"
						onChange={setEmail}
						placeholder="Enter your email address"
						type="email"
						value={email}
					/>

					<PasswordField
						autoComplete="new-password"
						hint={PASSWORD_HINT}
						label="Password"
						name="password"
						onChange={setPassword}
						value={password}
					/>

					<FormError message={error} />

					<button
						className={cn(
							buttonVariants({ variant: "primary" }),
							"h-11 rounded-[8px]",
						)}
						disabled={pending}
						type="submit"
					>
						{pending ? "Creating your account…" : "Create account"}
					</button>
				</form>

				<p className="text-center text-[13px] text-ink-muted">
					Already have an account?{" "}
					<a
						className="text-ink underline underline-offset-4 transition-colors duration-200 hover:text-brand"
						href={SIGN_IN_HREF}
					>
						Sign in
					</a>
				</p>
			</div>
		</AuthShell>
	);
}
