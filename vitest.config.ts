import { fileURLToPath } from "node:url";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import StatsReporter from "./vitest-stats-reporter.ts";

/**
 * Deliberately separate from `vite.config.ts`.
 *
 * The app config loads `tanstackStart()`, which generates the route tree and
 * applies SSR/server-function transforms. Under Vitest that machinery is both
 * unnecessary and actively harmful — it rewrites module graphs the tests never
 * exercise. Components are plain React, so `@vitejs/plugin-react` is all we need
 * to compile them. Route-level behaviour is covered by the production build.
 */
export default defineConfig({
	plugins: [viteReact()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"#": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		/**
		 * Four times the default, because some of these tests genuinely are slow
		 * rather than stuck: `build-starter` and `guide` each generate every
		 * stack the wizard allows — 2784 of them — and assert something about
		 * all of them. Under a full run, with workers competing, that crossed
		 * the 5s default and took unrelated suites down with it.
		 *
		 * The matrix itself is generated once per file (`test/starter-matrix.ts`)
		 * rather than once per test. This is the headroom on top of that, not
		 * instead of it.
		 */
		testTimeout: 20_000,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		/**
		 * `default` keeps the usual console output; the second one writes the
		 * suite's own totals to `src/test/suite-stats.ts` so the landing page can
		 * quote them without a human keeping the number in sync.
		 */
		reporters: ["default", new StatsReporter()],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.{test,spec}.{ts,tsx}",
				"src/test/**",
				"src/routeTree.gen.ts",
			],
		},
	},
});
