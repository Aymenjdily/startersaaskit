import { describe, expect, it } from "vitest";
import { assertUrl, readEnv } from "./supabase";

/**
 * These guard the two ways a pasted `.env` line goes wrong without looking
 * wrong. Both were real: `VITE_SUPABASE_URL=L=https://…` reached supabase-js as
 * a URL beginning `L=`, and `VITE_SUPABASE_ANON_KEY==sb_…` reached it with a
 * leading `=`. The first failed with a message that never named the variable;
 * the second was accepted and failed later as a 401.
 */
describe("readEnv", () => {
	it("returns the value when it is fine", () => {
		expect(readEnv("VITE_X", "value")).toBe("value");
	});

	it("trims whitespace a paste left behind", () => {
		expect(readEnv("VITE_X", "  value \n")).toBe("value");
	});

	it.each([
		undefined,
		"",
		"   ",
	])("rejects %p by naming the variable", (bad) => {
		expect(() => readEnv("VITE_SUPABASE_URL", bad)).toThrow(
			/VITE_SUPABASE_URL/,
		);
	});

	it("calls out a doubled equals sign", () => {
		expect(() =>
			readEnv("VITE_SUPABASE_ANON_KEY", "=sb_publishable_x"),
		).toThrow(/doubled "="/);
	});

	/** The message is what the reader sees, so it must not carry the secret. */
	it("does not put the value in the doubled-equals message", () => {
		expect(() =>
			readEnv("VITE_SUPABASE_ANON_KEY", "=sb_publishable_x"),
		).toThrow(expect.not.stringContaining("sb_publishable_x"));
	});
});

describe("assertUrl", () => {
	it.each([
		"https://example.supabase.co",
		"http://localhost:54321",
	])("accepts %s", (url) => {
		expect(assertUrl(url)).toBe(url);
	});

	it.each([
		"L=https://example.supabase.co",
		"example.supabase.co",
		"ftp://example.supabase.co",
	])("rejects %s", (url) => {
		expect(() => assertUrl(url)).toThrow(/must start with http/);
	});

	/** A URL is not a secret, and seeing it is how you spot the stray character. */
	it("shows what it actually got", () => {
		expect(() => assertUrl("L=https://example.supabase.co")).toThrow(
			/L=https:\/\/example\.supabase\.co/,
		);
	});
});
