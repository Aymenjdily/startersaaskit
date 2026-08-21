import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { todos } from "./schema";

/**
 * These assert the *emitted SQL shape*, not the TypeScript types. Drizzle infers
 * a column's database name from the property key unless you pass one explicitly,
 * so a rename in `schema.ts` silently changes the column the app queries while
 * the types stay green. Migrations already applied to Neon would then no longer
 * match. Locking the wire-level names here makes that failure loud.
 */
describe("todos table", () => {
	const table = getTableConfig(todos);
	const byName = new Map(table.columns.map((c) => [c.name, c]));

	it("maps to the `todos` table", () => {
		expect(table.name).toBe("todos");
	});

	it("has exactly the columns the app queries", () => {
		expect([...byName.keys()].sort()).toEqual(["created_at", "id", "title"]);
	});

	it("uses a serial primary key", () => {
		const id = byName.get("id");
		expect(id?.primary).toBe(true);
		expect(id?.notNull).toBe(true);
		expect(id?.getSQLType()).toBe("serial");
	});

	it("requires a title", () => {
		const title = byName.get("title");
		expect(title?.getSQLType()).toBe("text");
		expect(title?.notNull).toBe(true);
		expect(title?.primary).toBe(false);
	});

	/**
	 * `createdAt` is the one column whose JS name and SQL name differ. If the
	 * explicit `"created_at"` argument is ever dropped, Drizzle would fall back to
	 * `"createdAt"` and every existing row would become unreadable.
	 */
	it("stores createdAt as snake_case with a database-side default", () => {
		const createdAt = byName.get("created_at");
		expect(createdAt).toBeDefined();
		expect(createdAt?.getSQLType()).toBe("timestamp");
		expect(createdAt?.hasDefault).toBe(true);
	});
});
