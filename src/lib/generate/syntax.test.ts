import ts from "typescript";
import { describe, expect, it } from "vitest";
import { everyGeneratedStarter } from "@/test/starter-matrix";

/**
 * Every TypeScript file the generator emits has to parse.
 *
 * This exists because of a bug it would have caught immediately. A generated
 * test contained `/postgresql:\/\//`, and an escaping mistake shipped it as
 * `/postgresql:///` — which is a valid regex followed by a line comment, so
 * the file *ran*, the generated suite *passed*, and the syntax error only
 * surfaced when someone ran `typecheck` on a real starter.
 *
 * The lesson is the interesting part: the matrix already asserted that every
 * combination builds, emits no empty file and writes valid JSON. None of those
 * look inside a `.ts` file. "It is a string of the right shape" and "it is
 * code" are different claims, and only the second one matters to whoever
 * unzips it.
 *
 * Parsing only, deliberately. Type checking the matrix would mean resolving
 * imports against dependencies that are not installed — that is what the
 * generated project's own `typecheck` script is for, run against a real
 * install. This catches the class of mistake that comes from *generating*
 * code: a mis-escaped template, an unbalanced brace, a stray backtick.
 */

const SOURCE = /\.tsx?$/;

/** Syntactic diagnostics only — no program, no module resolution. */
function syntaxErrorsIn(path: string, contents: string) {
	const source = ts.createSourceFile(
		path,
		contents,
		ts.ScriptTarget.ESNext,
		/* setParentNodes */ false,
		path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	/* `parseDiagnostics` is internal but is the only way to get syntax errors
	   without building a program, which would need the dependency tree. */
	const diagnostics =
		(source as unknown as { parseDiagnostics?: ts.Diagnostic[] })
			.parseDiagnostics ?? [];

	return diagnostics.map((diagnostic) => {
		const { line } = source.getLineAndCharacterOfPosition(
			diagnostic.start ?? 0,
		);
		const message = ts.flattenDiagnosticMessageText(
			diagnostic.messageText,
			" ",
		);

		return `${path}:${line + 1} ${message}`;
	});
}

describe("the TypeScript it generates", () => {
	/** A sanity check on the checker itself, so a green run means something. */
	it("reports a file that does not parse", () => {
		expect(syntaxErrorsIn("broken.ts", "const a = (;")).not.toEqual([]);
	});

	it("accepts one that does", () => {
		expect(syntaxErrorsIn("fine.ts", "export const a = 1;\n")).toEqual([]);
	});

	it("parses in every combination the wizard allows", () => {
		const broken: string[] = [];

		for (const { answers, files } of everyGeneratedStarter()) {
			for (const [path, contents] of Object.entries(files)) {
				if (!SOURCE.test(path)) continue;

				for (const error of syntaxErrorsIn(path, contents)) {
					broken.push(`[${answers.framework}/${answers.auth}] ${error}`);
				}
			}
		}

		/* Printed rather than counted: a failure here should say which file, in
		   which stack, on which line. */
		expect(broken).toEqual([]);
	});
});
