import { describe, expect, it } from "vitest";
import { buildStarter } from "./build-starter";
import { allFolderIds, toFileTree } from "./file-tree";

const names = (nodes: ReturnType<typeof toFileTree>) =>
	nodes.map((node) => node.name);

describe("toFileTree", () => {
	it("keeps a flat list flat", () => {
		expect(names(toFileTree(["package.json", "tsconfig.json"]))).toEqual([
			"package.json",
			"tsconfig.json",
		]);
	});

	/**
	 * Case-insensitively, so `package.json` precedes `README.md` rather than
	 * every capitalised name being herded to the top. That is what a file
	 * explorer does, and `localeCompare` gives it for free.
	 */
	it("ignores case when sorting", () => {
		expect(names(toFileTree(["README.md", "package.json"]))).toEqual([
			"package.json",
			"README.md",
		]);
	});

	it("nests a path into folders", () => {
		const [src] = toFileTree(["src/db/client.ts"]);

		expect(src.name).toBe("src");
		expect(src.children?.[0].name).toBe("db");
		expect(src.children?.[0].children?.[0].name).toBe("client.ts");
	});

	/** Two files in one folder must not produce that folder twice. */
	it("merges paths that share a folder", () => {
		const tree = toFileTree(["src/a.ts", "src/b.ts"]);

		expect(tree).toHaveLength(1);
		expect(names(tree[0].children ?? [])).toEqual(["a.ts", "b.ts"]);
	});

	/**
	 * `src/lib/utils.ts` and `src/stack.ts` share only the first segment. A
	 * prefix match rather than a segment match would bury the second one.
	 */
	it("splits paths that share a prefix but not a folder", () => {
		const [src] = toFileTree(["src/lib/utils.ts", "src/stack.ts"]);

		expect(names(src.children ?? [])).toEqual(["lib", "stack.ts"]);
	});

	it("ids every node by its full path", () => {
		const [src] = toFileTree(["src/db/client.ts"]);

		expect(src.id).toBe("src");
		expect(src.children?.[0].id).toBe("src/db");
		expect(src.children?.[0].children?.[0].id).toBe("src/db/client.ts");
	});

	describe("ordering", () => {
		/** No file explorer interleaves folders with files. */
		it("puts folders above files", () => {
			const tree = toFileTree([
				"README.md",
				"src/a.ts",
				"package.json",
				"app/b.tsx",
			]);

			expect(names(tree)).toEqual(["app", "src", "package.json", "README.md"]);
		});

		it("sorts each level, not just the top", () => {
			const [src] = toFileTree(["src/z.ts", "src/a.ts", "src/m/x.ts"]);

			expect(names(src.children ?? [])).toEqual(["m", "a.ts", "z.ts"]);
		});

		it("does not depend on the order the paths arrived in", () => {
			const one = toFileTree(["src/b.ts", "app/a.tsx", "README.md"]);
			const other = toFileTree(["README.md", "src/b.ts", "app/a.tsx"]);

			expect(one).toEqual(other);
		});
	});

	describe("input it should not choke on", () => {
		it("returns nothing for nothing", () => {
			expect(toFileTree([])).toEqual([]);
		});

		it("ignores a leading slash rather than making an empty folder", () => {
			expect(names(toFileTree(["/README.md"]))).toEqual(["README.md"]);
		});

		it("ignores a doubled slash", () => {
			const [src] = toFileTree(["src//a.ts"]);

			expect(names(src.children ?? [])).toEqual(["a.ts"]);
		});

		/** Contradictory input — the folder wins, since something is inside it. */
		it("prefers the folder when a name is used as both", () => {
			const [node] = toFileTree(["src", "src/a.ts"]);

			expect(node.children).toBeDefined();
			expect(names(node.children ?? [])).toEqual(["a.ts"]);
		});
	});

	/**
	 * The tree is drawn from exactly what the zip contains, so it has to survive
	 * real generated output rather than only hand-written fixtures.
	 */
	it("handles a real generated starter", () => {
		const files = Object.keys(
			buildStarter({
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
			}),
		);
		const tree = toFileTree(files);

		const leaves = (nodes: ReturnType<typeof toFileTree>): number =>
			nodes.reduce(
				(count, node) => count + (node.children ? leaves(node.children) : 1),
				0,
			);

		expect(leaves(tree)).toBe(files.length);

		/* Everything that is source is under one root, so the tree has `src` at
		   the top and the config files beside it. A landing template adds
		   `public/` for the assets it serves — the only other top-level folder
		   the generator emits, and one a browser reads directly rather than a
		   bundler. */
		const folders = tree.filter((node) => node.children);
		expect(names(folders)).toEqual(["public", "src"]);
	});
});

describe("allFolderIds", () => {
	it("finds every folder, at every depth", () => {
		const tree = toFileTree(["src/db/client.ts", "app/page.tsx", "README.md"]);

		expect(allFolderIds(tree).sort()).toEqual(["app", "src", "src/db"]);
	});

	it("finds none in a flat list", () => {
		expect(allFolderIds(toFileTree(["README.md"]))).toEqual([]);
	});
});
