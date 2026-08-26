import { type FormEvent, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { BRAND, SIGN_UP_HREF } from "@/lib/brand";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AuthShell } from "./auth-shell";
import {
	AFTER_SIGN_IN_HREF,
	Divider,
	Field,
	FormError,
	PasswordField,
	ProviderButtons,
} from "./controls";

/**
 * The console sign-in. Structure follows the reference console: a glass card
 * centred on scenery — mark, greeting, providers, `or`, credentials — rather
 * than the landing page's full-width sections. It is a different surface and
 * reads as one.
 */
export function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Supabase reports a wrong password and an unknown address with the same
	 * message on purpose — telling them apart turns the form into a check for
	 * which addresses have accounts. Its wording is passed through unchanged.
	 */
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		try {
			const { error: failure } = await getSupabase().auth.signInWithPassword({
				email,
				password,
			});

			if (failure) {
				setError(failure.message);
				return;
			}
			window.location.assign(AFTER_SIGN_IN_HREF);
		} catch (thrown) {
			setError(
				thrown instanceof Error ? thrown.message : "Could not sign you in.",
			);
		} finally {
			setPending(false);
		}
	}

	return (
		<AuthShell
			tagline="Pick your stack. We generate the repo."
			title={`Welcome to ${BRAND}`}
		>
			<div className="flex flex-col gap-6">
				<ProviderButtons onError={setError} verb="Continue" />

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
						autoComplete="current-password"
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
						{pending ? "Signing you in…" : "Continue"}
					</button>
				</form>

				<p className="text-center text-[13px] text-ink-muted">
					New here?{" "}
					<a
						className="text-ink underline underline-offset-4 transition-colors duration-200 hover:text-brand"
						href={SIGN_UP_HREF}
					>
						Create an account
					</a>
				</p>
			</div>
		</AuthShell>
	);
}
