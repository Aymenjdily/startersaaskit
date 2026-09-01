import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
	it("reports its state as a switch, not a checkbox", () => {
		render(<Switch checked label="Analytics" onChange={vi.fn()} />);

		const control = screen.getByRole("switch", { name: "Analytics" });
		expect(control).toHaveAttribute("aria-checked", "true");
	});

	it("reports off the same way", () => {
		render(<Switch checked={false} label="Analytics" onChange={vi.fn()} />);

		expect(screen.getByRole("switch", { name: "Analytics" })).toHaveAttribute(
			"aria-checked",
			"false",
		);
	});

	it("asks to flip, rather than tracking its own state", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Switch checked={false} label="Analytics" onChange={onChange} />);

		await user.click(screen.getByRole("switch", { name: "Analytics" }));

		expect(onChange).toHaveBeenCalledWith(true);
	});

	it("flips the other way from on", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Switch checked label="Analytics" onChange={onChange} />);

		await user.click(screen.getByRole("switch", { name: "Analytics" }));

		expect(onChange).toHaveBeenCalledWith(false);
	});

	it("refuses the click while disabled", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<Switch checked disabled label="Analytics" onChange={onChange} />);

		await user.click(screen.getByRole("switch", { name: "Analytics" }));

		expect(onChange).not.toHaveBeenCalled();
	});
});
