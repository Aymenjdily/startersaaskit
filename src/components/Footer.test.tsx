import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestedByDefault } from "@/components/landing/tested-by-default";
import { UseCases } from "@/components/landing/use-cases";
import { WiredGrid } from "@/components/landing/wired-grid";
import { BRAND, LOGO_SIZE, LOGO_SRC, README_URL, REPO_URL } from "@/lib/brand";
import { SUITE_STATS } from "@/test/suite-stats";
import {
	AGENT_FILES,
	Footer,
	PRODUCT_LINKS,
	REPO_LINKS,
	STACK_LINKS,
	TOOLING_LINKS,
} from "./Footer";
import { Navbar } from "./Navbar";

const repoPath = (path: string) => resolve(process.cwd(), path);

const manifest = () =>
	JSON.parse(readFileSync(repoPath("package.json"), "utf8"));

const installed = (): Set<string> =>
	new Set([
		...Object.keys(manifest().dependencies ?? {}),
		...Object.keys(manifest().devDependencies ?? {}),
	]);

const link = (name: string) => screen.getByRole("link", { name });

/**
 * A PNG's IHDR chunk is fixed-offset: 8-byte signature, 4-byte length, the tag,
 * then width and height as big-endian uint32s. Cheaper than a dependency.
 */
const imageSize = (path: string) => {
	const png = readFileSync(path);

	expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
	return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

/** The sections the in-page anchors promise are down there. */
const ANCHOR_TARGETS = [
	{ id: "features", Section: WiredGrid },
	{ id: "testing", Section: TestedByDefault },
	{ id: "use-cases", Section: UseCases },
];

/** The sections rendered here to prove their anchors ask jsdom about motion. */
beforeEach(() => {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn(),
		}),
	});
});

describe("Footer", () => {
	it("renders identical markup on the server across separate renders", () => {
		expect(renderToString(<Footer />)).toBe(renderToString(<Footer />));
	});

	it("groups its links under headings", () => {
		render(<Footer />);

		for (const title of [
			"Product",
			"Repository",
			"Stack",
			"Tooling",
			"Point your agent at it",
		]) {
			expect(screen.getByRole("heading", { name: title })).toBeVisible();
		}
	});

	/**
	 * A footer is where dead links go to live. Every one of these resolves to
	 * something checkable, so a link cannot outlast the thing it points at.
	 */
	describe("where its links actually go", () => {
		it("points in-page links at anchors this page renders", () => {
			render(<Footer />);

			for (const { label, href } of PRODUCT_LINKS) {
				expect(link(label)).toHaveAttribute("href", href);
			}
			/* Rooted at `/`, because the footer is rendered on the legal pages too
			   and a bare `#features` scrolls nowhere from there. */
			expect(PRODUCT_LINKS.map(({ href }) => href)).toEqual(
				ANCHOR_TARGETS.map(({ id }) => `/#${id}`),
			);
		});

		it.each(ANCHOR_TARGETS)("$id is an id some section carries", ({
			id,
			Section,
		}) => {
			const { container } = render(<Section />);

			expect(container.querySelector(`#${id}`)).not.toBeNull();
		});

		it("points repository links at the one repo the page names", () => {
			render(<Footer />);

			expect(link("GitHub")).toHaveAttribute("href", REPO_URL);
			expect(link("README")).toHaveAttribute("href", README_URL);
			for (const { href } of REPO_LINKS) {
				expect(href.startsWith(REPO_URL)).toBe(true);
			}
		});

		it.each([
			...STACK_LINKS,
			...TOOLING_LINKS,
		])("$label is a package this repo installs", ({ pkg }) => {
			expect(installed().has(pkg)).toBe(true);
		});

		it.each(AGENT_FILES)("%s is a file an agent would find", (file) => {
			expect(existsSync(repoPath(file))).toBe(true);
		});

		/**
		 * `target="_blank"` without `rel="noreferrer"` leaks the referrer and hands
		 * the opened page a live `window.opener` handle.
		 */
		it("opens outbound links safely and leaves anchors alone", () => {
			render(<Footer />);

			for (const anchor of screen.getAllByRole("link")) {
				const href = anchor.getAttribute("href") as string;
				if (!href.startsWith("http")) {
					expect(anchor).not.toHaveAttribute("target");
					continue;
				}
				expect(anchor).toHaveAttribute("target", "_blank");
				expect(anchor).toHaveAttribute(
					"rel",
					expect.stringContaining("noreferrer"),
				);
			}
		});

		it("names each destination once", () => {
			const hrefs = [
				...PRODUCT_LINKS,
				...REPO_LINKS,
				...STACK_LINKS,
				...TOOLING_LINKS,
			].map(({ href }) => href);

			expect(new Set(hrefs).size).toBe(hrefs.length);
		});
	});

	describe("the bar it ends on", () => {
		it("reports the run the suite last published", () => {
			render(<Footer />);

			expect(
				screen.getByText(`${SUITE_STATS.total} tests passing on this site`),
			).toBeVisible();
		});

		/**
		 * The count measures this storefront, not the starter the reader would
		 * receive — and we cannot measure that one from here. Unqualified, a status
		 * dot beside a test count reads as a promise about the product.
		 */
		it("says which repo the count belongs to", () => {
			render(<Footer />);

			expect(
				screen.getByText(new RegExp(`${SUITE_STATS.total} tests passing`)),
			).toHaveTextContent(/on this site$/);
		});

		/** The dot is the reference's status light. It must stop for reduced motion. */
		it("pulses through the class that reduced motion switches off", () => {
			const { container } = render(<Footer />);
			const css = readFileSync(repoPath("src/styles.css"), "utf8");

			expect(container.querySelector(".dot-pulse")).not.toBeNull();
			expect(
				css
					.split("@media (prefers-reduced-motion: reduce)")[1]
					?.includes(".dot-pulse"),
			).toBe(true);
		});

		it("copyrights the current year", () => {
			const { container } = render(<Footer />);

			expect(container).toHaveTextContent(
				`© ${new Date().getFullYear()} ${BRAND}`,
			);
		});
	});

	/**
	 * The wordmark is the navbar's logo at page width. It repeats branding the
	 * page has already given, so a screen reader announcing it is noise — and an
	 * `alt` here would be that announcement.
	 */
	describe("the logo it signs off with", () => {
		it("keeps the wordmark out of the accessibility tree", () => {
			const { container } = render(<Footer />);
			const wordmark = container.querySelector(
				"[data-wordmark]",
			) as HTMLElement;

			expect(wordmark).toHaveAttribute("src", LOGO_SRC);
			expect(wordmark).toHaveAttribute("alt", "");
			expect(wordmark).toHaveAttribute("aria-hidden", "true");
			expect(within(container).queryAllByRole("img")).toHaveLength(0);
		});

		it("points at a file that ships in public/", () => {
			expect(existsSync(repoPath(`public/${LOGO_SRC}`))).toBe(true);
		});

		/** Reserves the box before the file lands, so the bottom bar cannot jump. */
		it("declares the ratio the file actually has", () => {
			const { width, height } = imageSize(repoPath(`public/${LOGO_SRC}`));

			expect({ width, height }).toEqual(LOGO_SIZE);
		});

		/** One file, two sizes. Printed twice by hand, one of them would go stale. */
		it("is the same file the navbar prints", () => {
			render(<Navbar />);

			expect(screen.getByAltText(BRAND)).toHaveAttribute("src", LOGO_SRC);
		});
	});
});
