import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StarterPreview } from "@/lib/starter-preview";
import { HeroGenerator } from "./hero-generator";

/**
 * The server function, stubbed so a click can actually open a file.
 *
 * `starterFile` runs the generator on the server and is unreachable from jsdom.
 * Everything else in the module — `previewKey` especially — stays real, because
 * a stubbed key would make the lookup tests pass for the wrong reason.
 */
vi.mock("@/lib/starter-preview", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/starter-preview")>()),
	starterFile: vi.fn(async ({ data }: { data: { path: string } }) => ({
		path: data.path,
		source: `// fetched ${data.path}`,
	})),
}));

/**
 * Three combinations, shaped like the server's output.
 *
 * Fixtures rather than the real `buildStarter`: these tests are about what the
 * panel does with a set of previews, and running the generator here would make
 * them slow and would fail for reasons that have nothing to do with the panel.
 * That the previews are real is `starter-preview`'s problem.
 */
const PREVIEWS: StarterPreview[] = [
	{
		framework: "nextjs",
		database: "neon",
		tree: [{ id: "drizzle.config.ts", name: "drizzle.config.ts" }],
		files: 44,
		tests: 7,
		opening: {
			path: "src/db/schema.ts",
			source: "export const users = table(",
		},
	},
	{
		framework: "nextjs",
		database: "supabase",
		tree: [{ id: "supabase", name: "supabase" }],
		files: 46,
		tests: 8,
		opening: { path: "src/lib/supabase.ts", source: "createBrowserClient(" },
	},
	{
		framework: "react_vite",
		database: "supabase",
		tree: [{ id: "index.html", name: "index.html" }],
		files: 39,
		tests: 7,
		opening: { path: "src/main.tsx", source: "createRoot(document" },
	},
];

const chip = (name: string) => screen.getByRole("button", { name });

describe("HeroGenerator", () => {
	it("opens on the first combination and draws its files", () => {
		render(<HeroGenerator previews={PREVIEWS} />);

		expect(screen.getByText("drizzle.config.ts")).toBeVisible();
		expect(screen.getByText("44 files · 7 tests")).toBeVisible();
	});

	it("redraws when the answer changes", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		await user.click(chip("Supabase"));

		expect(screen.getByText("supabase")).toBeVisible();
		expect(screen.getByText("46 files · 8 tests")).toBeVisible();
	});

	/**
	 * The argument the whole panel exists to make.
	 *
	 * A browser-only app has no server to hold a connection string, so Neon
	 * cannot be paired with it. Showing the option go dead is the demonstration;
	 * a sentence saying so is not.
	 */
	it("disables the databases a browser-only app cannot reach", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		expect(chip("Neon")).toBeEnabled();

		await user.click(chip("React + Vite"));

		expect(chip("Neon")).toBeDisabled();
		expect(chip("Supabase")).toBeEnabled();
	});

	/**
	 * Choosing a framework can invalidate the database already chosen. Left
	 * alone, the panel would look up a pairing that does not exist and render
	 * nothing — an empty box the visitor caused and cannot explain.
	 */
	it("moves off an answer the new framework rules out", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		/* Neon is selected, and React + Vite cannot have it. */
		await user.click(chip("React + Vite"));

		expect(screen.getByText("index.html")).toBeVisible();
		expect(screen.getByText("39 files · 7 tests")).toBeVisible();
		expect(screen.queryByText(/no preview/i)).not.toBeInTheDocument();
	});

	/**
	 * A tree of names proves a repo has structure. The source proves somebody
	 * wrote it, which is the thing a visitor is actually sceptical about.
	 */
	it("opens on a real file, not an empty pane", () => {
		render(<HeroGenerator previews={PREVIEWS} />);

		expect(screen.getByText("src/db/schema.ts")).toBeVisible();
		expect(screen.getByText(/export const users = table\(/)).toBeVisible();
	});

	it("shows the file that belongs to the chosen stack", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		await user.click(chip("React + Vite"));

		expect(screen.getByText("src/main.tsx")).toBeVisible();
		expect(screen.getByText(/createRoot\(document/)).toBeVisible();
	});

	/**
	 * Files are openable, so they have to be buttons. A div with a click handler
	 * looks identical and cannot be reached from a keyboard.
	 */
	it("makes files focusable and folders not", () => {
		render(<HeroGenerator previews={PREVIEWS} />);

		expect(
			screen.getByRole("button", { name: "drizzle.config.ts" }),
		).toBeVisible();
	});

	it("opens the file a visitor clicks", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		await user.click(screen.getByRole("button", { name: "drizzle.config.ts" }));

		/* The name is deliberately not asserted here: once the file opens it
		   appears twice, in the tree and in the path header, which is correct
		   and makes a bare text query ambiguous. The source is unique. */
		expect(
			await screen.findByText("// fetched drizzle.config.ts"),
		).toBeVisible();
	});

	/**
	 * The gap a mutation found: without the reset this passed anyway, because no
	 * test had ever *opened* a file, so the panel was falling through to the
	 * opening file for the wrong reason.
	 *
	 * `schema.ts` in a Drizzle repo does not exist in a Supabase-client one, so
	 * a file left open across a stack change is source from a starter nobody is
	 * looking at any more.
	 */
	it("drops an opened file when the stack changes under it", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		await user.click(screen.getByRole("button", { name: "drizzle.config.ts" }));
		expect(
			await screen.findByText("// fetched drizzle.config.ts"),
		).toBeVisible();

		await user.click(chip("React + Vite"));

		expect(
			screen.queryByText("// fetched drizzle.config.ts"),
		).not.toBeInTheDocument();
		expect(screen.getByText("src/main.tsx")).toBeVisible();
	});

	it("says why an option is out of reach rather than just greying it", async () => {
		const user = userEvent.setup();

		render(<HeroGenerator previews={PREVIEWS} />);
		await user.click(chip("React + Vite"));

		expect(chip("Neon")).toHaveAttribute(
			"title",
			expect.stringContaining("server"),
		);
	});
});
