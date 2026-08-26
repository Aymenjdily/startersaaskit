import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildStarter } from "@/lib/generate/build-starter";
import { starterGuide, starterTour } from "@/lib/generate/guide";
import type { StarterAnswers } from "@/lib/starter-questions";
import { StarterGuide } from "./starter-guide";

const answers: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "supabase",
	orm: "drizzle",
	auth: "supabase_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

const files = buildStarter(answers);
const steps = starterGuide(files, answers);
const tour = starterTour(files);

const show = () => render(<StarterGuide steps={steps} tour={tour} />);

/**
 * The row a command sits in.
 *
 * By its Copy button rather than by the text: the command shares its element
 * with a decorative `$`, so a text query lands on a node whose content is not
 * quite the command.
 */
const rowFor = (command: string): HTMLElement => {
	const row = screen
		.getAllByRole("button", { name: /^Copy$/ })
		.map((button) => button.parentElement as HTMLElement)
		.find((element) => element.textContent?.includes(command));

	if (!row) throw new Error(`no command row for "${command}"`);
	return row;
};

describe("StarterGuide", () => {
	it("shows every step it is given, in order", () => {
		show();

		expect(
			screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
		).toEqual(steps.map((step) => step.title));
	});

	it("numbers them, so the order is the instruction", () => {
		const { container } = show();
		const list = container.querySelector("ol");

		expect(list?.children).toHaveLength(steps.length);
	});

	/**
	 * The reason the guide is generated rather than written: it names this
	 * starter's commands. If the rendering dropped them the page would look
	 * right and say nothing useful.
	 */
	it("prints the actual commands for this stack", () => {
		show();
		const printed = screen
			.getAllByText(/^\$/)
			.map((el) => el.parentElement?.textContent?.replace(/^\$\s*/, ""));

		for (const step of steps) {
			for (const command of step.commands ?? []) {
				expect(printed).toContain(command.command);
			}
		}
		/* The fixture chose pnpm, and the guide follows the answer rather than
		   assuming npm — which is the whole point of asking. */
		expect(printed).toContain("pnpm install");
		expect(printed).toContain("cd my-app");
	});

	it("lists the variables that have to be filled in", () => {
		show();
		const variables = steps.flatMap((step) => step.variables ?? []);

		expect(variables.length).toBeGreaterThan(0);
		for (const variable of variables) {
			expect(screen.getByText(variable.name)).toBeVisible();
		}
	});

	/**
	 * The prefix is the only thing between a publishable key and a secret one
	 * reaching every visitor, so the page says which is which rather than
	 * leaving the reader to notice the naming convention.
	 */
	it("marks the variables that reach the browser", () => {
		show();
		const publicNames = steps
			.flatMap((step) => step.variables ?? [])
			.filter((variable) => variable.isPublic)
			.map((variable) => variable.name);

		expect(publicNames.length).toBeGreaterThan(0);
		expect(screen.getAllByText("public")).toHaveLength(publicNames.length);
	});

	describe("copying a command", () => {
		it("puts it on the clipboard and says so", async () => {
			/* Set up *before* the stub: `userEvent.setup()` installs a clipboard
			   of its own, so stubbing first would be overwritten and the spy
			   would never see the call. */
			const user = userEvent.setup();
			const writeText = vi.fn().mockResolvedValue(undefined);
			vi.stubGlobal("navigator", { clipboard: { writeText } });

			show();
			const row = rowFor("pnpm install");
			await user.click(within(row).getByRole("button", { name: "Copy" }));

			expect(writeText).toHaveBeenCalledWith("pnpm install");
			expect(
				await within(row).findByRole("button", { name: "Copied" }),
			).toBeVisible();

			vi.unstubAllGlobals();
		});

		/**
		 * `navigator.clipboard` is undefined on an insecure origin. A guide that
		 * throws when a button is pressed is worse than one that does nothing.
		 */
		it("does nothing rather than throwing where there is no clipboard", async () => {
			const user = userEvent.setup();
			vi.stubGlobal("navigator", {});
			show();

			const row = rowFor("pnpm install");
			await expect(
				user.click(within(row).getByRole("button", { name: "Copy" })),
			).resolves.not.toThrow();

			vi.unstubAllGlobals();
		});
	});

	describe("where to look first", () => {
		it("lists each file with what it is for", () => {
			const { container } = show();
			/* Scoped to the section: a step's body mentions `src/lib/env.ts` too,
			   and now that backticks render as code an unscoped query matches
			   both. */
			const section = container.querySelector("dl.divide-y") as HTMLElement;

			for (const entry of tour) {
				expect(within(section).getByText(entry.path)).toBeVisible();
				expect(within(section).getByText(entry.what)).toBeVisible();
			}
		});

		it("says nothing at all when there is nothing to point at", () => {
			render(<StarterGuide steps={steps} tour={[]} />);

			expect(
				screen.queryByRole("heading", { name: "Where to look first" }),
			).toBeNull();
		});
	});
});
