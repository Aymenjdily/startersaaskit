import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUITE_STATS } from "@/test/suite-stats";
import {
	PROVISION_STEPS,
	SIGN_IN_FIELDS,
	SPEC_PAIRS,
	specFor,
	TODO_COLUMNS,
	USE_CASES,
	UseCases,
} from "./use-cases";

const repoPath = (path: string) => resolve(process.cwd(), path);
const read = (path: string) => readFileSync(repoPath(path), "utf8");

const scripts = (): Record<string, string> =>
	JSON.parse(read("package.json")).scripts;

/**
 * The column names Postgres would actually show, which is not always the key:
 * `createdAt: timestamp("created_at")` is `created_at` in the table. Reading
 * the keys alone would have let the screen print a name no query returns.
 */
function columnsOf(table: string): string[] {
	const body = read("src/db/schema.ts").split(`pgTable("${table}"`)[1] ?? "";

	return [...body.matchAll(/(\w+):\s*\w+\((?:"([^"]+)")?/g)].map(
		([, key, name]) => name ?? key,
	);
}

const names = (container: HTMLElement) =>
	within(container.querySelector("[data-cases]") as HTMLElement);

const nameButton = (container: HTMLElement, title: string) =>
	names(container).getByRole("button", { name: title });

const lit = (container: HTMLElement) =>
	names(container)
		.getAllByRole("button")
		.find((button) => button.getAttribute("aria-current") === "true");

/**
 * jsdom has no `matchMedia`. The rotation asks it whether motion is welcome, so
 * every test has to answer — and the answer decides whether the interval that
 * drives the panel exists at all.
 */
function stubMotion(reduced: boolean) {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		writable: true,
		value: (query: string) => ({
			matches: reduced,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn(),
		}),
	});
}

describe("UseCases", () => {
	beforeEach(() => stubMotion(false));

	afterEach(() => {
		vi.useRealTimers();
		Reflect.deleteProperty(window, "matchMedia");
	});

	it("renders the section heading", () => {
		render(<UseCases />);

		expect(
			screen.getByRole("heading", {
				name: "The same starting point, whatever you are building",
			}),
		).toBeInTheDocument();
	});

	it("renders identical markup on the server across separate renders", () => {
		expect(renderToString(<UseCases />)).toBe(renderToString(<UseCases />));
	});

	/** The navbar's "Use cases" menu links here, so the anchor has to exist. */
	it("is the target the navbar menu points at", () => {
		const { container } = render(<UseCases />);

		expect(container.querySelector("#use-cases")).not.toBeNull();
	});

	it("names every use case", () => {
		const { container } = render(<UseCases />);

		for (const { title } of USE_CASES) {
			expect(nameButton(container, title)).toBeVisible();
		}
	});

	describe("the name the reader is looking at", () => {
		it("lights exactly one, and starts on the first", () => {
			const { container } = render(<UseCases />);

			expect(
				names(container)
					.getAllByRole("button")
					.filter((b) => b.getAttribute("aria-current") === "true"),
			).toHaveLength(1);
			expect(lit(container)).toHaveTextContent(USE_CASES[0].title);
		});

		it("moves on its own", () => {
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => void vi.advanceTimersByTime(3600));

			expect(lit(container)).toHaveTextContent(USE_CASES[1].title);
		});

		it("wraps back round to the first", () => {
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => void vi.advanceTimersByTime(3600 * USE_CASES.length));

			expect(lit(container)).toHaveTextContent(USE_CASES[0].title);
		});

		/** A panel that keeps moving after a deliberate click reads as broken. */
		it("stops rotating once the reader picks one", () => {
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => {
				fireEvent.click(nameButton(container, USE_CASES[3].title));
			});
			expect(lit(container)).toHaveTextContent(USE_CASES[3].title);

			act(() => void vi.advanceTimersByTime(3600 * 3));
			expect(lit(container)).toHaveTextContent(USE_CASES[3].title);
		});

		it("follows the keyboard", () => {
			const { container } = render(<UseCases />);

			act(() => {
				fireEvent.focus(nameButton(container, USE_CASES[2].title));
			});

			expect(lit(container)).toHaveTextContent(USE_CASES[2].title);
		});

		it("holds still when the reader asked for no motion", () => {
			stubMotion(true);
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => void vi.advanceTimersByTime(3600 * 3));

			expect(lit(container)).toHaveTextContent(USE_CASES[0].title);
			expect(vi.getTimerCount()).toBe(0);
		});

		it("clears its interval on unmount", () => {
			vi.useFakeTimers();
			const { unmount } = render(<UseCases />);

			expect(vi.getTimerCount()).toBe(1);
			unmount();
			expect(vi.getTimerCount()).toBe(0);
		});

		it("shows the copy belonging to the lit name", () => {
			const { container } = render(<UseCases />);

			expect(screen.getByText(USE_CASES[0].text)).toBeVisible();

			act(() => {
				fireEvent.click(nameButton(container, USE_CASES[4].title));
			});

			expect(screen.getByText(USE_CASES[4].text)).toBeVisible();
			expect(screen.queryByText(USE_CASES[0].text)).toBeNull();
		});
	});

	/**
	 * Each panel is a picture of something in this repo. A picture of a thing
	 * that changed underneath it is the one failure this section can have, so
	 * every screen is checked back against its source.
	 */
	describe("the screens each one shows", () => {
		it("gives every use case its own screen", () => {
			const rendered = new Set(USE_CASES.map(({ Screen }) => Screen));

			expect(rendered.size).toBe(USE_CASES.length);
		});

		it("signs in with the fields auth.ts turns on", () => {
			const source = read("src/lib/auth.ts");

			expect(source).toContain("emailAndPassword");
			expect(source).toContain("enabled: true");
			expect(SIGN_IN_FIELDS).toEqual(["Email", "Password"]);

			render(<UseCases />);
			for (const field of SIGN_IN_FIELDS) {
				expect(screen.getByText(field)).toBeInTheDocument();
			}
		});

		it("browses the columns the schema actually declares", () => {
			render(<UseCases />);

			expect(columnsOf("todos")).toEqual(TODO_COLUMNS);
			for (const column of TODO_COLUMNS) {
				expect(screen.getByText(column)).toBeInTheDocument();
			}
		});

		it("provisions from the file the plugin is pointed at", () => {
			const source = read("neon-vite-plugin.ts");
			const shown = PROVISION_STEPS.map(({ text }) => text).join(" ");

			expect(shown).toContain("DATABASE_URL");
			expect(source).toContain("dotEnvKey: 'DATABASE_URL'");
			expect(shown).toContain("db/init.sql");
			expect(source).toContain("path: 'db/init.sql'");
			expect(existsSync(repoPath("db/init.sql"))).toBe(true);
		});

		it("reports the run the suite last published", () => {
			render(<UseCases />);

			expect(
				screen.getByText(
					`${SUITE_STATS.total} passed (${SUITE_STATS.files} files)`,
				),
			).toBeInTheDocument();
			for (const dir of Object.keys(SUITE_STATS.byDir)) {
				expect(screen.getByText(dir)).toBeInTheDocument();
			}
		});

		it("pairs modules with specs that are really beside them", () => {
			for (const module of SPEC_PAIRS) {
				expect(existsSync(repoPath(module))).toBe(true);
				expect(existsSync(repoPath(specFor(module)))).toBe(true);
			}
		});

		it("derives the spec name from the module's own extension", () => {
			expect(specFor("src/lib/utils.ts")).toBe("src/lib/utils.test.ts");
			expect(specFor("a/b/hero.tsx")).toBe("a/b/hero.test.tsx");
		});

		it("labels screens with commands this repo defines", () => {
			for (const name of ["db:studio", "dev", "test"]) {
				expect(scripts()).toHaveProperty(name);
			}
		});
	});
});
