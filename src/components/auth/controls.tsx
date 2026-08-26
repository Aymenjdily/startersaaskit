import { useId, useState } from "react";
import { BrandGlyph } from "@/components/landing/brand-glyph";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/**
 * The parts sign-in and sign-up share. Both pages offer the same providers and
 * take the same credentials, so the difference between them should be the one
 * Supabase call they make — not a second copy of the form around it.
 */

/** Where a signed-in reader lands. Onboarding decides where they go from there. */
export const AFTER_SIGN_IN_HREF = "/dashboard";

/** Where the providers hand the reader back. Served by `routes/auth.callback.tsx`. */
export const CALLBACK_PATH = "/auth/callback";

/**
 * OAuth providers, in the order the reference lists them. The `id` is both the
 * Supabase provider name and the `BRAND_ICONS` key, so the glyph is looked up
 * from it rather than stored alongside it — a button cannot end up wearing one
 * provider's mark while signing you in to another.
 */
export const OAUTH_PROVIDERS = [
	{ id: "github", label: "GitHub" },
	{ id: "google", label: "Google" },
] as const;

/**
 * Controls here are `rounded-[8px]`, not the 4px the landing CTAs use. A narrow
 * column of stacked 44px controls needs the softer radius to hold together.
 */
export const CONTROL =
	"h-11 w-full rounded-[8px] border border-white/12 bg-black/25 px-3 text-[14px] text-ink transition-colors duration-200";

export function Field({
	autoComplete,
	hint,
	label,
	name,
	onChange,
	placeholder,
	trailing,
	type,
	value,
}: {
	autoComplete: string;
	hint?: string;
	label: string;
	name: string;
	onChange: (value: string) => void;
	placeholder: string;
	trailing?: React.ReactNode;
	type: string;
	value: string;
}) {
	const id = useId();
	const hintId = useId();

	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-[13px] font-medium text-ink" htmlFor={id}>
				{label}
			</label>
			<div className="relative">
				<input
					aria-describedby={hint ? hintId : undefined}
					autoComplete={autoComplete}
					className={cn(
						CONTROL,
						"placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand",
						trailing && "pr-11",
					)}
					id={id}
					name={name}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					required
					type={type}
					value={value}
				/>
				{trailing}
			</div>
			{hint && (
				<p className="text-[12px] text-ink-muted" id={hintId}>
					{hint}
				</p>
			)}
		</div>
	);
}

/** A password field that can be read back, since one typo locks you out twice. */
export function PasswordField({
	autoComplete,
	hint,
	label,
	name,
	onChange,
	value,
}: {
	autoComplete: string;
	hint?: string;
	label: string;
	name: string;
	onChange: (value: string) => void;
	value: string;
}) {
	const [visible, setVisible] = useState(false);

	return (
		<Field
			autoComplete={autoComplete}
			hint={hint}
			label={label}
			name={name}
			onChange={onChange}
			placeholder="Enter your password"
			trailing={
				<button
					aria-label={visible ? "Hide password" : "Show password"}
					className="absolute inset-y-0 right-0 px-3 text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					onClick={() => setVisible((shown) => !shown)}
					type="button"
				>
					{visible ? "Hide" : "Show"}
				</button>
			}
			type={visible ? "text" : "password"}
			value={value}
		/>
	);
}

/**
 * OAuth is identical on both pages — the provider decides whether an account is
 * being created or resumed, so there is no sign-up variant of this to write.
 */
export function ProviderButtons({
	onError,
	verb,
}: {
	onError: (message: string | null) => void;
	verb: string;
}) {
	async function start(provider: (typeof OAUTH_PROVIDERS)[number]["id"]) {
		onError(null);

		try {
			const { error } = await getSupabase().auth.signInWithOAuth({
				provider,
				options: { redirectTo: `${window.location.origin}${CALLBACK_PATH}` },
			});

			if (error) onError(error.message);
		} catch (thrown) {
			onError(
				thrown instanceof Error ? thrown.message : "Could not sign you in.",
			);
		}
	}

	return (
		<div className="flex flex-col gap-2">
			{OAUTH_PROVIDERS.map((provider) => (
				<button
					className={cn(
						CONTROL,
						"flex items-center justify-center gap-2.5 font-medium hover:border-white/25 hover:bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
					)}
					key={provider.id}
					onClick={() => start(provider.id)}
					type="button"
				>
					<BrandGlyph className="h-[18px] w-[18px]" icon={provider.id} />
					{verb} with {provider.label}
				</button>
			))}
		</div>
	);
}

/** Decorative: it separates two things a screen reader already reads in order. */
export function Divider() {
	return (
		<div aria-hidden="true" className="flex items-center gap-3">
			<span className="h-px flex-1 bg-white/10" />
			<span className="text-[13px] text-ink-muted">or</span>
			<span className="h-px flex-1 bg-white/10" />
		</div>
	);
}

export function FormError({ message }: { message: string | null }) {
	if (!message) return null;

	return (
		<p className="text-[13px] text-diagram-red" role="alert">
			{message}
		</p>
	);
}
