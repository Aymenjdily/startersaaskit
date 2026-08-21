import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { USE_CASES, UseCases } from "./use-cases";

const repoPath = (path: string) => resolve(process.cwd(), path);

const scripts = (): Record<string, string> =>
	JSON.parse(readFileSync(repoPath("package.json"), "utf8")).scripts;

const grid = (container: HTMLElement) =>
	within(container.querySelector("[data-cases]") as HTMLElement);

/**
 * The cited files are the ones the last card promises are readable in a sitting.
 * Sixty lines is generous for what they contain today — `src/router.tsx` is 26 —
 * so this only trips if one of them grows into something the copy no longer
 * describes.
 */
const READABLE_LIMIT = 60;

describe("UseCases", () => {
	it("renders the section heading", () => {
		render(<UseCases />);

		expect(
			screen.getByRole("heading", {
				name: "The same starting point, whatever you are building",
			}),
		).toBeInTheDocument();
	});

	it("renders a card for every use case", () => {
		const { container } = render(<UseCases />);

		for (const { title } of USE_CASES) {
			expect(
				grid(container).getByRole("heading", { name: title }),
			).toBeVisible();
		}
	});

	it("renders every card's body copy", () => {
		const { container } = render(<UseCases />);

		for (const { text } of USE_CASES) {
			expect(grid(container).getByText(text)).toBeVisible();
		}
	});

	it("renders identical markup on the server across separate renders", () => {
		expect(renderToString(<UseCases />)).toBe(renderToString(<UseCases />));
	});

	/**
	 * Each card ends in a pointer at this repo. A card whose proof no longer
	 * resolves is a claim with nothing behind it, which is the one failure this
	 * section can have.
	 */
	describe("the proof each card points at", () => {
		it.each(USE_CASES)("$title resolves to something real", ({ proof }) => {
			if (proof.kind === "script") {
				expect(scripts()).toHaveProperty(proof.value);
				return;
			}
			expect(existsSync(repoPath(proof.value))).toBe(true);
		});

		it("shows scripts as the command you would actually type", () => {
			const { container } = render(<UseCases />);

			for (const { proof } of USE_CASES) {
				const label =
					proof.kind === "script" ? `pnpm ${proof.value}` : proof.value;
				expect(grid(container).getByText(label)).toBeVisible();
			}
		});

		it("gives each card its own proof", () => {
			const labels = USE_CASES.map(({ proof }) => proof.value);
			expect(new Set(labels).size).toBe(labels.length);
		});
	});

	/**
	 * "Short enough to read start to finish" is the only card that makes a
	 * measurable claim about the code rather than about what exists.
	 */
	it("keeps the files it calls readable actually readable", () => {
		for (const path of [
			"src/router.tsx",
			"src/lib/auth.ts",
			"src/db/schema.ts",
		]) {
			const lines = readFileSync(repoPath(path), "utf8").split("\n").length;
			expect(lines).toBeLessThanOrEqual(READABLE_LIMIT);
		}
	});
});
