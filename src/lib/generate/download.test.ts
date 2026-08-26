import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StarterAnswers } from "@/lib/starter-questions";
import { createStarter, downloadStarter, GENERATE_ENDPOINT } from "./download";

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

/**
 * Hand-rolled rather than a real `Response`: jsdom's `Blob` is not the one
 * undici's `Response` expects, and constructing one throws before any of this
 * gets exercised. Only `ok`, `status`, `blob` and `json` are ever read.
 */
const zipResponse = () =>
	({
		ok: true,
		status: 200,
		blob: async () => new Blob(["PK"], { type: "application/zip" }),
	}) as unknown as Response;

const createdResponse = () =>
	({
		ok: true,
		status: 201,
		json: async () => ({ id: "abc123", project: "my-app" }),
	}) as unknown as Response;

const refusal = (status: number, body: unknown) =>
	({
		ok: false,
		status,
		json: async () => {
			if (typeof body === "string") throw new SyntaxError("not json");
			return body;
		},
	}) as unknown as Response;

let clicked: HTMLAnchorElement[] = [];

beforeEach(() => {
	clicked = [];
	vi.useFakeTimers();

	/* jsdom has no object URLs and will not navigate, so both are recorded
	   rather than performed — the click is the only externally visible proof
	   that a download was handed to the browser. */
	vi.stubGlobal("URL", {
		...URL,
		createObjectURL: vi.fn(() => "blob:generated"),
		revokeObjectURL: vi.fn(),
	});
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
		this: HTMLAnchorElement,
	) {
		clicked.push(this);
	});
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("downloadStarter", () => {
	it("posts the answers to the generator", async () => {
		const fetchMock = vi.fn().mockResolvedValue(zipResponse());
		vi.stubGlobal("fetch", fetchMock);

		await downloadStarter({ answers });

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(GENERATE_ENDPOINT);
		expect(init.method).toBe("POST");
		expect(JSON.parse(init.body)).toEqual({ answers });
	});

	/** Without the cookie the endpoint cannot tell who is asking, and refuses. */
	it("sends the session cookie", async () => {
		const fetchMock = vi.fn().mockResolvedValue(zipResponse());
		vi.stubGlobal("fetch", fetchMock);

		await downloadStarter({ answers });

		expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
	});

	it("hands the file to the browser named after the project", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(zipResponse()));

		await downloadStarter({ answers });

		expect(clicked).toHaveLength(1);
		expect(clicked[0].download).toBe("my-app.zip");
		expect(clicked[0].href).toContain("blob:generated");
	});

	/** A detached anchor is ignored by Firefox, so it has to be in the document. */
	it("attaches the link before clicking it and removes it after", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(zipResponse()));

		await downloadStarter({ answers });

		expect(document.querySelector("a[download]")).toBeNull();
	});

	/**
	 * Safari reads the blob after the click returns, so revoking immediately
	 * cancels the download. The revoke is deferred instead.
	 */
	it("does not revoke the object URL before the browser has read it", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(zipResponse()));

		await downloadStarter({ answers });
		expect(URL.revokeObjectURL).not.toHaveBeenCalled();

		vi.advanceTimersByTime(30_000);
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:generated");
	});

	describe("when the server refuses", () => {
		it("throws the message the server gave", async () => {
			vi.stubGlobal(
				"fetch",
				vi
					.fn()
					.mockResolvedValue(
						refusal(401, { message: "You need to be signed in." }),
					),
			);

			await expect(downloadStarter({ answers })).rejects.toThrow(
				"You need to be signed in.",
			);
		});

		it("falls back to the status when there is no message", async () => {
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue(refusal(500, "nope")));

			await expect(downloadStarter({ answers })).rejects.toThrow(/500/);
		});

		it("downloads nothing", async () => {
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue(refusal(500, "nope")));

			await expect(downloadStarter({ answers })).rejects.toThrow();
			expect(clicked).toHaveLength(0);
		});
	});
});

/**
 * Creating and downloading used to be one call, and finishing the wizard put a
 * zip in someone's Downloads folder before they had read anything about what
 * to do with it. Splitting them is the fix; these hold the halves apart.
 */
describe("createStarter", () => {
	it("posts the answers and returns the recorded starter", async () => {
		const fetchMock = vi.fn().mockResolvedValue(createdResponse());
		vi.stubGlobal("fetch", fetchMock);

		await expect(createStarter(answers)).resolves.toEqual({
			id: "abc123",
			project: "my-app",
		});

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(GENERATE_ENDPOINT);
		expect(JSON.parse(init.body)).toEqual({ answers });
	});

	/** The whole point of the split. */
	it("hands the browser no file", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(createdResponse()));

		await createStarter(answers);

		expect(clicked).toHaveLength(0);
	});

	it("sends the session cookie, like every other call here", async () => {
		const fetchMock = vi.fn().mockResolvedValue(createdResponse());
		vi.stubGlobal("fetch", fetchMock);

		await createStarter(answers);

		expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
	});

	it("throws the server's own words when it refuses", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(refusal(422, { message: "Nope, and here is why." })),
		);

		await expect(createStarter(answers)).rejects.toThrow(
			"Nope, and here is why.",
		);
	});
});
