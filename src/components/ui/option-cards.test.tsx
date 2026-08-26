import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BRAND_ICONS } from "@/components/landing/brand-icons";
import { OptionCards } from "./option-cards";

const options = [
	{ id: "nextjs", label: "Next.js", icon: "nextdotjs" as const },
	{ id: "tanstack_start", label: "TanStack Start", icon: "tanstack" as const },
	{ id: "none", label: "Not yet", icon: null },
];

function renderCards(value?: string) {
	const onChange = vi.fn();
	const view = render(
		<OptionCards
			name="framework"
			onChange={onChange}
			options={options}
			value={value}
		/>,
	);
	return { ...view, onChange };
}

const card = (label: string) => screen.getByRole("radio", { name: label });

describe("OptionCards", () => {
	/**
	 * The visual change is the point, but the semantics are what a keyboard and
	 * a screen reader rely on. Cards built from divs would lose all of this,
	 * which is why the inputs are hidden rather than replaced.
	 */
	it("is still a radio group underneath", () => {
		renderCards();

		expect(screen.getAllByRole("radio")).toHaveLength(options.length);
		for (const option of options) {
			expect(card(option.label)).toHaveAttribute("name", "framework");
		}
	});

	it("names each card by its label", () => {
		renderCards();

		expect(card("Next.js")).toBeInTheDocument();
		expect(card("Not yet")).toBeInTheDocument();
	});

	it("shows the vendor's real mark", () => {
		const { container } = renderCards();

		const paths = [...container.querySelectorAll("path")].map((path) =>
			path.getAttribute("d"),
		);
		expect(paths).toContain(BRAND_ICONS.nextdotjs);
		expect(paths).toContain(BRAND_ICONS.tanstack);
	});

	/** "Not yet" is not a product; borrowing a logo for it would misrepresent it. */
	it("gives a choice with no product a mark of its own", () => {
		const { container } = renderCards();

		const paths = [...container.querySelectorAll("path")].map((p) =>
			p.getAttribute("d"),
		);
		const borrowed: string[] = Object.values(BRAND_ICONS);
		const neutral = paths.filter((d) => d && !borrowed.includes(d));

		expect(neutral.length).toBeGreaterThan(0);
	});

	it("marks the chosen one as checked", () => {
		renderCards("tanstack_start");

		expect(card("TanStack Start")).toBeChecked();
		expect(card("Next.js")).not.toBeChecked();
	});

	it("reports what was chosen", async () => {
		const user = userEvent.setup();
		const { onChange } = renderCards();

		await user.click(card("Next.js"));

		expect(onChange).toHaveBeenCalledWith("nextjs");
	});

	/** Clicking the card, not the hidden control, is what actually happens. */
	it("can be chosen by clicking the card itself", async () => {
		const user = userEvent.setup();
		const { onChange } = renderCards();

		await user.click(screen.getByText("Not yet"));

		expect(onChange).toHaveBeenCalledWith("none");
	});

	/**
	 * The glyphs are decoration beside a visible label. Announced, they would
	 * make a screen reader read every product name twice.
	 */
	it("does not announce the logos", () => {
		const { container } = renderCards();

		for (const svg of container.querySelectorAll("svg")) {
			expect(svg).toHaveAttribute("aria-hidden", "true");
		}
	});
});
