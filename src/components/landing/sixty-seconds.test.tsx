import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { SixtySeconds, STEPS } from "./sixty-seconds";

const read = (path: string) =>
	readFileSync(resolve(process.cwd(), path), "utf8");

const scripts = (): Record<string, string> =>
	JSON.parse(read("package.json")).scripts;

/**
 * The last line lands at 7700ms and the loop resets at 10300ms, so this has to
 * sit between the two — overshoot and you are asserting against a fresh prompt.
 */
const FULL_RUN = 8_000;

/**
 * Each command appears twice on purpose: once in the transcript and once on its
 * step card. Queries that mean "in the terminal" have to say so.
 */
const terminal = (container: HTMLElement) =>
	within(container.querySelector("[data-transcript]") as HTMLElement);

describe("SixtySeconds", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * The section's entire argument is that these three commands are all there
	 * is. A command that is not a real script would make the shortest section on
	 * the page the least true one.
	 */
	describe("the commands it tells you to run", () => {
		/** `install` is pnpm's own, not something package.json defines. */
		const BUILT_IN = new Set(["install"]);

		it.each(STEPS)("$cmd actually runs something", ({ cmd }) => {
			const [runner, name] = cmd.split(" ");
			expect(runner).toBe("pnpm");

			if (BUILT_IN.has(name)) {
				expect(existsSync(resolve(process.cwd(), "pnpm-lock.yaml"))).toBe(true);
				return;
			}
			expect(scripts()).toHaveProperty(name);
		});

		it("mentions the build script it points at in the footnote", () => {
			expect(scripts()).toHaveProperty("build");
		});

		it("renders every command on its step card", () => {
			const { container } = render(<SixtySeconds />);
			const cards = within(
				container.querySelector("[data-steps]") as HTMLElement,
			);

			for (const { cmd, title } of STEPS) {
				expect(cards.getByText(cmd)).toBeInTheDocument();
				expect(cards.getByRole("heading", { name: title })).toBeInTheDocument();
			}
		});
	});

	/**
	 * Step 02 claims Postgres provisions itself and writes DATABASE_URL, which is
	 * only true while the Neon plugin is wired up with that key.
	 */
	describe("the zero-config database claim", () => {
		it("still has the Neon plugin writing DATABASE_URL", () => {
			const plugin = read("neon-vite-plugin.ts");
			expect(plugin).toMatch(/dotEnvKey:\s*['"]DATABASE_URL['"]/);
		});

		it("is the same variable .env.example documents", () => {
			expect(read(".env.example")).toMatch(/^DATABASE_URL=/m);
		});

		it("is registered in the app's Vite config", () => {
			const config = read("vite.config.ts");
			expect(config).toMatch(/from\s+["']\.\/neon-vite-plugin/);
			expect(config).toMatch(/plugins:\s*\[[^\]]*\bneon\b/);
		});
	});

	/**
	 * Inverted guard. The footnote says no CI workflow or host config ships. If
	 * one is ever added, this fails and the copy has to catch up — which is the
	 * right direction for the failure to point.
	 */
	it("ships none of the deploy config it says it does not", () => {
		for (const path of [
			".github",
			"vercel.json",
			"netlify.toml",
			"wrangler.toml",
			"Dockerfile",
		]) {
			expect(existsSync(resolve(process.cwd(), path))).toBe(false);
		}
	});

	it("does not promise a deploy step", () => {
		render(<SixtySeconds />);
		const copy = document.body.textContent ?? "";

		expect(copy).not.toMatch(/deploys? (for you|in one|automatically)/i);
		expect(copy).toMatch(/no CI workflow or host config ships/i);
	});

	describe("server/client agreement", () => {
		it("renders identical markup across separate server renders", () => {
			expect(renderToString(<SixtySeconds />)).toBe(
				renderToString(<SixtySeconds />),
			);
		});

		it("starts on an empty prompt so hydration matches", () => {
			const server = document.createElement("div");
			server.innerHTML = renderToString(<SixtySeconds />);
			render(<SixtySeconds />);

			expect(server.querySelectorAll("[data-caret]")).toHaveLength(1);
			expect(server.textContent).not.toContain("dependencies installed");
			expect(screen.queryByText("dependencies installed")).toBeNull();
		});
	});

	describe("the transcript", () => {
		it("writes the first command before anything else", () => {
			const { container } = render(<SixtySeconds />);

			act(() => void vi.advanceTimersByTime(600));

			expect(terminal(container).getByText("pnpm install")).toBeInTheDocument();
			expect(terminal(container).queryByText("pnpm dev")).toBeNull();
		});

		it("reaches every line by the end of a run", () => {
			render(<SixtySeconds />);

			act(() => void vi.advanceTimersByTime(FULL_RUN));

			for (const text of [
				"dependencies installed",
				"neon: wrote DATABASE_URL to .env",
				"ready on localhost:3000",
				"every suite passed",
			]) {
				expect(screen.getByText(text)).toBeInTheDocument();
			}
		});

		it("shows exactly one caret at a time", () => {
			const { container } = render(<SixtySeconds />);

			act(() => void vi.advanceTimersByTime(3000));

			expect(container.querySelectorAll("[data-caret]")).toHaveLength(1);
		});

		it("restarts once the run finishes", () => {
			render(<SixtySeconds />);

			act(() => void vi.advanceTimersByTime(FULL_RUN));
			expect(screen.getByText("every suite passed")).toBeInTheDocument();

			act(() => void vi.advanceTimersByTime(3000));
			expect(screen.queryByText("every suite passed")).toBeNull();
		});

		it("clears its timer on unmount", () => {
			const { unmount } = render(<SixtySeconds />);
			expect(vi.getTimerCount()).toBe(1);

			unmount();

			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("the step cards", () => {
		const cards = (container: HTMLElement) =>
			container.querySelectorAll("[data-steps] > *");

		it("highlights the first step before the run starts", () => {
			const { container } = render(<SixtySeconds />);

			expect(cards(container)).toHaveLength(STEPS.length);
			expect(cards(container)[0].className).toContain("bg-brand-dim");
			expect(cards(container)[1].className).not.toContain("bg-brand-dim");
		});

		it("moves the highlight as the transcript reaches each step", () => {
			const { container } = render(<SixtySeconds />);

			act(() => void vi.advanceTimersByTime(FULL_RUN));

			expect(cards(container)[2].className).toContain("bg-brand-dim");
			expect(cards(container)[0].className).not.toContain("bg-brand-dim");
		});
	});

	describe("prefers-reduced-motion", () => {
		it("shows the finished transcript and schedules nothing", () => {
			setReducedMotion(true);
			render(<SixtySeconds />);

			expect(screen.getByText("every suite passed")).toBeInTheDocument();
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	it("marks the transcript as decorative", () => {
		const { container } = render(<SixtySeconds />);

		const transcript = container.querySelector("[data-transcript]");
		expect(transcript).toHaveAttribute("aria-hidden", "true");
	});
});
