import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	BUILDING_MAX,
	MESSAGE_MAX,
	MESSAGE_MIN,
	RATINGS,
} from "./product-feedback";

/**
 * The feedback table's rules, and the TypeScript that has to agree with them.
 *
 * The form is the courtesy; these constraints are the rule. Validating only in
 * the browser means the 2001st character comes back as a constraint violation
 * nobody can act on, and validating only in Postgres means finding out after
 * the round trip.
 */
const SQL = readFileSync(
	"supabase/migrations/0007_product_feedback.sql",
	"utf8",
);

describe("the product feedback migration", () => {
	it("bounds the message exactly where the form does", () => {
		expect(SQL).toContain(
			`char_length(trim(message)) between ${MESSAGE_MIN} and ${MESSAGE_MAX}`,
		);
	});

	it("bounds the optional field too", () => {
		expect(SQL).toContain(`char_length(building) <= ${BUILDING_MAX}`);
	});

	it("bounds the rating to the scale the dialog offers", () => {
		expect(SQL).toContain(
			`rating between ${RATINGS[0]} and ${RATINGS[RATINGS.length - 1]}`,
		);
	});

	it("requires the two fields the dialog requires", () => {
		expect(SQL).toMatch(/rating smallint not null/);
		expect(SQL).toMatch(/message text not null/);
	});

	describe("who can do what", () => {
		it("turns row level security on", () => {
			expect(SQL).toContain(
				"alter table public.product_feedback enable row level security",
			);
		});

		/* Without this the publishable key reads everybody's opinions, which
		   include what they are building. */
		it("scopes reading to the author or an admin", () => {
			expect(SQL).toMatch(
				/for select\s+using \(auth\.uid\(\) = user_id or public\.is_admin\(\)\)/,
			);
		});

		it("lets somebody write only their own", () => {
			expect(SQL).toMatch(
				/for insert\s+with check \(auth\.uid\(\) = user_id\)/,
			);
		});

		/**
		 * No update and no delete, for anybody.
		 *
		 * The reward pays once for a row existing. An editable row is a way to
		 * claim the ten generations and then blank the opinion that earned them,
		 * and a deletable one is the same trick with an extra step.
		 */
		it("lets nobody revise or remove one", () => {
			expect(SQL).not.toMatch(
				/create policy[\s\S]*?on public\.product_feedback[\s\S]*?for update/,
			);
			expect(SQL).not.toMatch(
				/create policy[\s\S]*?on public\.product_feedback[\s\S]*?for delete/,
			);
		});

		/* An opinion outlives the account, like a bug report — and the reward it
		   paid for has already been spent against `profiles`. */
		it("keeps the row when the account goes", () => {
			expect(SQL).toMatch(
				/user_id uuid references auth\.users on delete set null/,
			);
		});
	});
});
