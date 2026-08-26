import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BRAND_ICONS } from "@/components/landing/brand-icons";
import { SIGN_IN_HREF } from "@/lib/brand";
import { getSupabase } from "@/lib/supabase";
import { isServedRoute } from "@/test/served-route";
import { AFTER_SIGN_IN_HREF, CALLBACK_PATH, OAUTH_PROVIDERS } from "./controls";
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT, SignUp } from "./sign-up";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

const signUp = vi.fn();
const signInWithOAuth = vi.fn();

/** No session is the confirm-your-email case, which is the default setup. */
beforeEach(() => {
	signUp
		.mockReset()
		.mockResolvedValue({ data: { session: null }, error: null });
	signInWithOAuth.mockReset().mockResolvedValue({ error: null });
	vi.mocked(getSupabase).mockReturnValue({
		auth: { signUp, signInWithOAuth },
	} as unknown as ReturnType<typeof getSupabase>);
});

const emailBox = () => screen.getByLabelText("Email address");
const passwordBox = () => screen.getByLabelText("Password");
const submit = () => screen.getByRole("button", { name: "Create account" });

const GOOD_PASSWORD = "x".repeat(MIN_PASSWORD_LENGTH);

function captureNavigation() {
	const assign = vi.fn();
	Object.defineProperty(window, "location", {
		configurable: true,
		value: { assign, origin: "https://app.test", search: "" },
		writable: true,
	});
	return assign;
}

async function fillAndSubmit(password = GOOD_PASSWORD) {
	const user = userEvent.setup();
	await user.type(emailBox(), "ada@example.com");
	await user.type(passwordBox(), password);
	await user.click(submit());
}

describe("SignUp", () => {
	it("renders identical markup across separate server renders", () => {
		expect(renderToString(<SignUp />)).toBe(renderToString(<SignUp />));
	});

	it("says what the page is for", () => {
		render(<SignUp />);

		expect(
			screen.getByRole("heading", { name: "Create your account" }),
		).toBeVisible();
	});

	it("sends anyone who already has an account to sign-in", () => {
		render(<SignUp />);

		expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
			"href",
			SIGN_IN_HREF,
		);
		expect(isServedRoute(SIGN_IN_HREF)).toBe(true);
	});

	describe("the credentials form", () => {
		/**
		 * `new-password` is what makes a password manager offer to generate one.
		 * `current-password` here would make it offer the reader's existing one.
		 */
		it("asks the password manager to suggest a new password", () => {
			render(<SignUp />);

			expect(emailBox()).toHaveAttribute("autocomplete", "email");
			expect(passwordBox()).toHaveAttribute("autocomplete", "new-password");
		});

		it("signs up with what the reader typed", async () => {
			captureNavigation();
			render(<SignUp />);

			await fillAndSubmit();

			expect(signUp).toHaveBeenCalledWith({
				email: "ada@example.com",
				password: GOOD_PASSWORD,
				options: { emailRedirectTo: `https://app.test${CALLBACK_PATH}` },
			});
		});

		it("confirms the link is coming instead of pretending they are in", async () => {
			captureNavigation();
			render(<SignUp />);

			await fillAndSubmit();

			expect(
				await screen.findByRole("heading", { name: "Check your inbox" }),
			).toBeVisible();
			expect(screen.getByText(/ada@example\.com/)).toBeVisible();
		});

		/**
		 * Supabase returns a user and no session both for a new address and for
		 * one that already has an account, so that a signup form cannot be used
		 * to enumerate who has one. This page must not undo that by wording the
		 * two outcomes differently.
		 */
		it("does not confirm whether that address was already taken", async () => {
			captureNavigation();
			render(<SignUp />);

			await fillAndSubmit();

			const panel = await screen.findByRole("heading", {
				name: "Check your inbox",
			});
			expect(panel.closest("main")).toHaveTextContent(
				/if that address can be/i,
			);
		});

		/** A project with confirmation switched off hands back a session instead. */
		it("goes straight to the console when a session comes back", async () => {
			const assign = captureNavigation();
			signUp.mockResolvedValue({
				data: { session: { access_token: "t" } },
				error: null,
			});
			render(<SignUp />);

			await fillAndSubmit();

			await waitFor(() =>
				expect(assign).toHaveBeenCalledWith(AFTER_SIGN_IN_HREF),
			);
			expect(screen.queryByText("Check your inbox")).toBeNull();
		});

		it("shows what Supabase said when it refuses", async () => {
			captureNavigation();
			signUp.mockResolvedValue({
				data: { session: null },
				error: { message: "Signups not allowed for this instance" },
			});
			render(<SignUp />);

			await fillAndSubmit();

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Signups not allowed for this instance",
			);
		});

		it("survives the client throwing rather than returning an error", async () => {
			captureNavigation();
			signUp.mockRejectedValue(new Error("Supabase is not configured."));
			render(<SignUp />);

			await fillAndSubmit();

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Supabase is not configured.",
			);
			expect(submit()).toBeEnabled();
		});

		it("disables the button while the request is in flight", async () => {
			captureNavigation();
			let release: (value: unknown) => void = () => {};
			signUp.mockReturnValue(
				new Promise((resolve) => {
					release = resolve;
				}),
			);
			render(<SignUp />);

			await fillAndSubmit();

			expect(
				screen.getByRole("button", { name: "Creating your account…" }),
			).toBeDisabled();

			await act(
				async () => void release({ data: { session: null }, error: null }),
			);
		});
	});

	describe("the password rule", () => {
		it("tells the reader the rule before they type", () => {
			render(<SignUp />);

			expect(passwordBox()).toHaveAccessibleDescription(PASSWORD_HINT);
		});

		/**
		 * The hint is a promise the page makes, so the page has to keep it —
		 * otherwise a short password is accepted here and rejected by Supabase,
		 * and the reader is told the rule twice with only one of them enforced.
		 */
		it("refuses a password shorter than the hint promises", async () => {
			captureNavigation();
			render(<SignUp />);

			await fillAndSubmit("x".repeat(MIN_PASSWORD_LENGTH - 1));

			expect(await screen.findByRole("alert")).toHaveTextContent(PASSWORD_HINT);
			expect(signUp).not.toHaveBeenCalled();
		});

		it("accepts one exactly as long as the hint promises", async () => {
			captureNavigation();
			render(<SignUp />);

			await fillAndSubmit();

			expect(signUp).toHaveBeenCalled();
		});

		it("reveals and re-hides what was typed", async () => {
			const user = userEvent.setup();
			render(<SignUp />);

			await user.click(screen.getByRole("button", { name: "Show password" }));
			expect(passwordBox()).toHaveAttribute("type", "text");

			await user.click(screen.getByRole("button", { name: "Hide password" }));
			expect(passwordBox()).toHaveAttribute("type", "password");
		});
	});

	describe("the OAuth providers", () => {
		it("offers each one in the page's own words", () => {
			render(<SignUp />);

			for (const { label } of OAUTH_PROVIDERS) {
				expect(
					screen.getByRole("button", { name: `Sign up with ${label}` }),
				).toBeVisible();
			}
		});

		it.each(OAUTH_PROVIDERS)("wears $id's mark", ({ id, label }) => {
			render(<SignUp />);

			const button = screen.getByRole("button", {
				name: `Sign up with ${label}`,
			});
			expect(button.querySelector("path")).toHaveAttribute(
				"d",
				BRAND_ICONS[id],
			);
		});

		it.each(OAUTH_PROVIDERS)("sends $id back to the callback route", async ({
			id,
			label,
		}) => {
			const user = userEvent.setup();
			captureNavigation();
			render(<SignUp />);

			await user.click(
				screen.getByRole("button", { name: `Sign up with ${label}` }),
			);

			expect(signInWithOAuth).toHaveBeenCalledWith({
				provider: id,
				options: { redirectTo: `https://app.test${CALLBACK_PATH}` },
			});
		});

		it("does not submit the credentials form", () => {
			render(<SignUp />);

			for (const { label } of OAUTH_PROVIDERS) {
				expect(
					screen.getByRole("button", { name: `Sign up with ${label}` }),
				).toHaveAttribute("type", "button");
			}
		});
	});
});
