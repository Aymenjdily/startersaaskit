/**
 * Flat paths into the nested shape MagicUI's file tree renders.
 *
 * `buildStarter` returns `{ "app/page.tsx": "…" }` — a map keyed by full path,
 * which is the right shape for zipping and the wrong one for drawing. This is
 * the conversion, kept pure so the awkward parts have tests: a folder that
 * exists only because something is inside it, two files sharing a prefix, and
 * ordering that has to put folders above files at every level rather than
 * sorting the whole list alphabetically and hoping.
 */

/** The shape the vendored `Tree` takes. Mirrors its `TreeViewElement`. */
export type TreeNode = {
	id: string;
	name: string;
	isSelectable?: boolean;
	children?: TreeNode[];
};

type Mutable = TreeNode & { children?: Mutable[]; isFolder: boolean };

/**
 * Folders first, then files, each alphabetically.
 *
 * Sorting by name alone interleaves `src/` between `README.md` and
 * `tsconfig.json`, which is how no file explorer has ever worked.
 */
function order(nodes: Mutable[]): TreeNode[] {
	return [...nodes]
		.sort((a, b) => {
			if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
		.map(({ isFolder, children, ...node }) =>
			isFolder ? { ...node, children: order(children ?? []) } : node,
		);
}

/**
 * A tree for `paths`, with `id` set to the full path.
 *
 * The id is the path rather than an index so selecting a node says something
 * useful, and so two runs over the same files produce the same ids.
 */
export function toFileTree(paths: string[]): TreeNode[] {
	const roots: Mutable[] = [];

	for (const path of paths) {
		const segments = path.split("/").filter(Boolean);
		let level = roots;
		let sofar = "";

		segments.forEach((segment, index) => {
			sofar = sofar ? `${sofar}/${segment}` : segment;
			const isFolder = index < segments.length - 1;

			let node = level.find((candidate) => candidate.name === segment);
			if (!node) {
				node = {
					id: sofar,
					name: segment,
					isFolder,
					...(isFolder ? { children: [] } : {}),
				};
				level.push(node);
			}

			if (isFolder) {
				/* A path can name a folder that an earlier path created as a leaf
				   only if the input is contradictory — `a` and `a/b` together. The
				   folder wins, because something is demonstrably inside it. */
				node.isFolder = true;
				node.children ??= [];
				level = node.children;
			}
		});
	}

	return order(roots);
}

/** Every folder id, so the tree can open fully rather than start collapsed. */
export function allFolderIds(nodes: TreeNode[]): string[] {
	return nodes.flatMap((node) =>
		node.children ? [node.id, ...allFolderIds(node.children)] : [],
	);
}
