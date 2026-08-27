import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BRAND_ICONS } from "@/components/landing/brand-icons";
import { BRAND, SIGN_UP_HREF } from "@/lib/brand";
import { getSupabase } from "@/lib/supabase";
import { isServedRoute } from "@/test/served-route";
import { SCENE_TITLE } from "./auth-backdrop";
import {
	AFTER_SIGN_IN_HREF,
	CALLBACK_PATH,
	DISABLED_OAUTH_PROVIDERS,
	OAUTH_PROVIDERS,
} from "./controls";
import { SignIn } from "./sign-in";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();

/** Every call site awaits the result, so the default has to be thenable. */
beforeEach(() => {
	signInWithPassword.mockReset().mockResolvedValue({ error: null });
	signInWithOAuth.mockReset().mockResolvedValue({ error: null });
	vi.mocked(getSupabase).mockReturnValue({
		auth: { signInWithPassword, signInWithOAuth },
	} as unknown as ReturnType<typeof getSupabase>);
});

const emailBox = () => screen.getByLabelText("Email address");
const passwordBox = () => screen.getByLabelText("Password");
const submit = () => screen.getByRole("button", { name: "Continue" });

/**
 * jsdom refuses to navigate and logs "Not implemented" instead, so the whole
 * `location` object is swapped for a recorder. Redirecting on success is the
 * only externally visible proof the sign-in worked.
 */
function captureNavigation() {
	const assign = vi.fn();
	Object.defineProperty(window, "location", {
		configurable: true,
		value: { assign, origin: "https://app.test", search: "" },
		writable: true,
	});
	return assign;
}

describe("SignIn", () => {
	it("renders identical markup across separate server renders", () => {
		expect(renderToString(<SignIn />)).toBe(renderToString(<SignIn />));
	});

	it("greets the reader by the product name", () => {
		render(<SignIn />);

		expect(
			screen.getByRole("heading", { name: `Welcome to ${BRAND}` }),
		).toBeVisible();
	});

	it("sends anyone without an account to sign-up", () => {
		render(<SignIn />);

		expect(
			screen.getByRole("link", { name: "Create an account" }),
		).toHaveAttribute("href", SIGN_UP_HREF);
	});

	/** The link above is only worth anything if something answers at the far end. */
	it("offers sign-up at a path the file router actually serves", () => {
		expect(isServedRoute(SIGN_UP_HREF)).toBe(true);
	});

	describe("the credentials form", () => {
		it("labels both fields so they can be filled by name", () => {
			render(<SignIn />);

			expect(emailBox()).toHaveAttribute("type", "email");
			expect(passwordBox()).toHaveAttribute("type", "password");
		});

		/**
		 * Browsers and password managers key off `autocomplete`. Getting these
		 * wrong is the difference between a saved password appearing and not.
		 */
		it("asks the password manager for the right values", () => {
			render(<SignIn />);

			expect(emailBox()).toHaveAttribute("autocomplete", "email");
			expect(passwordBox()).toHaveAttribute("autocomplete", "current-password");
		});

		it("signs in with what the reader typed", async () => {
			const user = userEvent.setup();
			const assign = captureNavigation();
			render(<SignIn />);

			await user.type(emailBox(), "ada@example.com");
			await user.type(passwordBox(), "hunter2");
			await user.click(submit());

			expect(signInWithPassword).toHaveBeenCalledWith({
				email: "ada@example.com",
				password: "hunter2",
			});
			await waitFor(() =>
				expect(assign).toHaveBeenCalledWith(AFTER_SIGN_IN_HREF),
			);
		});

		/** A form that reloads the page loses the error it was about to show. */
		it("does not let the browser submit the form itself", async () => {
			captureNavigation();
			render(<SignIn />);

			const event = new Event("submit", { bubbles: true, cancelable: true });
			const form = document.querySelector("form") as HTMLFormElement;
			await act(async () => void form.dispatchEvent(event));

			expect(event.defaultPrevented).toBe(true);
		});

		it("shows what Supabase said when it refuses", async () => {
			const user = userEvent.setup();
			captureNavigation();
			signInWithPassword.mockResolvedValue({
				error: { message: "Invalid login credentials" },
			});
			render(<SignIn />);

			await user.type(emailBox(), "ada@example.com");
			await user.type(passwordBox(), "wrong");
			await user.click(submit());

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Invalid login credentials",
			);
		});

		/** A thrown client — an unset key, say — must not leave a dead button. */
		it("survives the client throwing rather than returning an error", async () => {
			const user = userEvent.setup();
			captureNavigation();
			signInWithPassword.mockRejectedValue(
				new Error("Supabase is not configured."),
			);
			render(<SignIn />);

			await user.type(emailBox(), "ada@example.com");
			await user.type(passwordBox(), "hunter2");
			await user.click(submit());

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Supabase is not configured.",
			);
			expect(submit()).toBeEnabled();
		});

		it("clears a stale error before trying again", async () => {
			const user = userEvent.setup();
			captureNavigation();
			signInWithPassword.mockResolvedValueOnce({
				error: { message: "Invalid login credentials" },
			});
			render(<SignIn />);

			await user.type(emailBox(), "ada@example.com");
			await user.type(passwordBox(), "wrong");
			await user.click(submit());
			expect(await screen.findByRole("alert")).toBeVisible();

			await user.click(submit());

			await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
		});

		/** Double-submitting a login is how you get rate-limited by your own UI. */
		it("disables the button while the request is in flight", async () => {
			const user = userEvent.setup();
			captureNavigation();
			let release: (value: { error: null }) => void = () => {};
			signInWithPassword.mockReturnValue(
				new Promise((resolve) => {
					release = resolve;
				}),
			);
			render(<SignIn />);

			await user.type(emailBox(), "ada@example.com");
			await user.type(passwordBox(), "hunter2");
			await user.click(submit());

			expect(
				screen.getByRole("button", { name: "Signing you in…" }),
			).toBeDisabled();

			await act(async () => void release({ error: null }));
		});
	});

	describe("the password toggle", () => {
		it("reveals and re-hides what was typed", async () => {
			const user = userEvent.setup();
			render(<SignIn />);

			await user.click(screen.getByRole("button", { name: "Show password" }));
			expect(passwordBox()).toHaveAttribute("type", "text");

			await user.click(screen.getByRole("button", { name: "Hide password" }));
			expect(passwordBox()).toHaveAttribute("type", "password");
		});

		/** Inside a form, a button with no explicit type submits it. */
		it("does not submit the form", () => {
			render(<SignIn />);

			expect(
				screen.getByRole("button", { name: "Show password" }),
			).toHaveAttribute("type", "button");
		});
	});

	describe("the OAuth providers", () => {
		it("offers each one", () => {
			render(<SignIn />);

			for (const { label } of OAUTH_PROVIDERS) {
				expect(
					screen.getByRole("button", { name: `Continue with ${label}` }),
				).toBeVisible();
			}
		});

		it.each(OAUTH_PROVIDERS)("sends $id back to the callback route", async ({
			id,
			label,
		}) => {
			const user = userEvent.setup();
			captureNavigation();
			render(<SignIn />);

			await user.click(
				screen.getByRole("button", { name: `Continue with ${label}` }),
			);

			expect(signInWithOAuth).toHaveBeenCalledWith({
				provider: id,
				options: { redirectTo: `https://app.test${CALLBACK_PATH}` },
			});
		});

		/**
		 * The provider hands the reader back to `redirectTo` carrying a code that
		 * is worth nothing unless a route is waiting to trade it in. Asserting the
		 * redirect alone would still pass if that route were renamed or deleted.
		 */
		it("redirects at a path the file router actually serves", () => {
			expect(isServedRoute(CALLBACK_PATH)).toBe(true);
		});

		/**
		 * GitHub is listed in `DISABLED_OAUTH_PROVIDERS` rather than deleted, so
		 * it would be easy to re-export it by accident. A provider whose OAuth
		 * app is not ready hands people to a consent screen and fails after they
		 * have agreed — so its absence is worth asserting.
		 */
		it("offers no button for a disabled provider", () => {
			render(<SignIn />);

			for (const { label } of DISABLED_OAUTH_PROVIDERS) {
				expect(
					screen.queryByRole("button", { name: `Continue with ${label}` }),
				).not.toBeInTheDocument();
			}
		});

		it("reports a provider that refuses to start", async () => {
			const user = userEvent.setup();
			captureNavigation();
			signInWithOAuth.mockResolvedValue({
				error: { message: "Provider is not enabled" },
			});
			render(<SignIn />);

			await user.click(
				screen.getByRole("button", { name: "Continue with Google" }),
			);

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Provider is not enabled",
			);
		});

		/**
		 * The glyph is looked up by `id`, so it cannot be paired with the wrong
		 * provider — but it can still be missing. `brand-icons.test.ts` is what
		 * checks each path is the mark it claims to be.
		 */
		it.each(OAUTH_PROVIDERS)("wears $id's mark", ({ id, label }) => {
			render(<SignIn />);

			const button = screen.getByRole("button", {
				name: `Continue with ${label}`,
			});
			expect(button.querySelector("path")).toHaveAttribute(
				"d",
				BRAND_ICONS[id],
			);
		});

		it("does not submit the credentials form", () => {
			render(<SignIn />);

			for (const { label } of OAUTH_PROVIDERS) {
				expect(
					screen.getByRole("button", { name: `Continue with ${label}` }),
				).toHaveAttribute("type", "button");
			}
		});
	});

	describe("accessibility", () => {
		it("hides the decorative divider from screen readers", () => {
			render(<SignIn />);

			const divider = screen.getByText("or").parentElement as HTMLElement;
			expect(divider).toHaveAttribute("aria-hidden", "true");
		});

		/**
		 * The scene carries no information, but it does carry a `<title>` — SVG's
		 * accessible name. Left exposed it would announce "Dusk over rolling
		 * hills" ahead of the greeting on every visit.
		 */
		it("hides the scenery from screen readers", () => {
			const { container } = render(<SignIn />);

			const title = container.querySelector("title");
			expect(title).toHaveTextContent(SCENE_TITLE);
			expect(title?.closest("div")).toHaveAttribute("aria-hidden", "true");
		});

		it("names the wordmark and links it home", () => {
			render(<SignIn />);

			expect(screen.getByAltText(BRAND).closest("a")).toHaveAttribute(
				"href",
				"/",
			);
		});

		it("marks both fields required", () => {
			render(<SignIn />);

			expect(emailBox()).toBeRequired();
			expect(passwordBox()).toBeRequired();
		});
	});

	/** `noValidate` is deliberate, so nothing here relies on browser validation. */
	it("still asks Supabase when the browser would have blocked the submit", async () => {
		captureNavigation();
		render(<SignIn />);

		await act(
			async () =>
				void fireEvent.submit(
					document.querySelector("form") as HTMLFormElement,
				),
		);

		await waitFor(() => expect(signInWithPassword).toHaveBeenCalled());
	});
});
