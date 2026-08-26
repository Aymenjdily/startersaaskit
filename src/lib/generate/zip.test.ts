import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import type { StarterAnswers } from "@/lib/starter-questions";
import { buildStarter } from "./build-starter";
import { zipStarter } from "./zip";

const answers: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "neon",
	orm: "drizzle",
	auth: "better_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

const unzip = (bytes: Uint8Array) => unzipSync(bytes);

describe("zipStarter", () => {
	const files = buildStarter(answers);

	it("produces an archive that unpacks", () => {
		const entries = unzip(zipStarter("my-app", files));

		expect(Object.keys(entries).length).toBe(Object.keys(files).length);
	});

	/** Unzipping should make one folder, not scatter files across Downloads. */
	it("puts everything under a single folder named for the project", () => {
		const entries = unzip(zipStarter("my-app", files));

		for (const path of Object.keys(entries)) {
			expect(path.startsWith("my-app/")).toBe(true);
		}
	});

	it("round-trips the contents unchanged", () => {
		const entries = unzip(zipStarter("my-app", files));

		expect(strFromU8(entries["my-app/README.md"])).toBe(files["README.md"]);
		expect(strFromU8(entries["my-app/package.json"])).toBe(
			files["package.json"],
		);
	});

	it("keeps nested paths nested", () => {
		const entries = unzip(zipStarter("my-app", files));

		expect(entries["my-app/src/lib/stack.ts"]).toBeDefined();
	});

	/**
	 * Byte-identical output for identical answers. Without a fixed mtime the
	 * archive carries the clock, and nothing about the result can be asserted.
	 */
	it("is byte-identical between runs", () => {
		expect(Array.from(zipStarter("my-app", files))).toEqual(
			Array.from(zipStarter("my-app", files)),
		);
	});

	it("actually compresses", () => {
		const raw = Object.values(files).reduce((n, f) => n + f.length, 0);

		expect(zipStarter("my-app", files).byteLength).toBeLessThan(raw);
	});
});
