import { existsSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { REELS, Reels } from "./reels";

describe("Reels", () => {
	it("shows a card for every reel", () => {
		render(<Reels />);

		for (const reel of REELS) {
			expect(
				screen.getByRole("button", { name: `Play: ${reel.title}` }),
			).toBeInTheDocument();
		}
	});

	/**
	 * Nothing downloads a video until it is asked for. The hero already
	 * autoplays a loop, and a band of clips that start on their own would put
	 * several megabytes on a page nobody has asked to watch anything on.
	 */
	it("loads no video until a reel is played", () => {
		const { container } = render(<Reels />);

		expect(container.querySelectorAll("video")).toHaveLength(0);
		expect(container.querySelectorAll("img")).toHaveLength(REELS.length);
	});

	it("plays the reel that was clicked, and only that one", async () => {
		const user = userEvent.setup();
		const { container } = render(<Reels />);

		await user.click(
			screen.getByRole("button", { name: `Play: ${REELS[0].title}` }),
		);

		const videos = container.querySelectorAll("video");
		expect(videos).toHaveLength(1);
		expect(videos[0].getAttribute("src")).toBe(`/reels/${REELS[0].file}.mp4`);
		/* Sound is the point of a talking clip, and the click is the gesture
		   that lets a browser allow it. */
		expect(videos[0].hasAttribute("muted")).toBe(false);
	});

	/**
	 * A caption that is not the clip's own words drifts from it the moment the
	 * clip is recut, and nobody re-watches 30 seconds of video to check.
	 */
	it("captions each reel with its title", () => {
		render(<Reels />);

		for (const reel of REELS) {
			expect(screen.getByText(reel.title)).toBeInTheDocument();
		}
	});

	/**
	 * The pair of files each reel names has to be on disk. A poster that 404s
	 * leaves a card that is a play button over nothing, and a missing mp4 fails
	 * only once someone clicks — both are invisible until a visitor finds them.
	 */
	it("ships the video and poster every reel points at", () => {
		for (const reel of REELS) {
			expect(
				existsSync(`public/reels/${reel.file}.mp4`),
				`missing public/reels/${reel.file}.mp4`,
			).toBe(true);
			expect(
				existsSync(`public/reels/${reel.file}.jpg`),
				`missing public/reels/${reel.file}.jpg`,
			).toBe(true);
		}
	});

	/** One h2 for the band, like every other section on the page. */
	it("heads the band with a single h2", () => {
		const { container } = render(<Reels />);

		expect(container.querySelectorAll("h2")).toHaveLength(1);
		expect(container.querySelectorAll("h1, h3")).toHaveLength(0);
	});
});
