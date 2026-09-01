import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteOwnAccount, updateDisplayName } from "./account";

const { updateUser, profileUpdate, profileEq, rpc } = vi.hoisted(() => ({
	updateUser: vi.fn(),
	profileUpdate: vi.fn(),
	profileEq: vi.fn(),
	rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
	getSupabase: () => ({
		auth: { updateUser },
		from: () => ({ update: profileUpdate }),
		rpc,
	}),
}));

beforeEach(() => {
	updateUser.mockReset();
	profileUpdate.mockReset();
	profileEq.mockReset();
	rpc.mockReset();
});

describe("updateDisplayName", () => {
	it("writes the name both places it lives", async () => {
		updateUser.mockResolvedValue({
			data: { user: { id: "u1" } },
			error: null,
		});
		profileUpdate.mockReturnValue({ eq: profileEq });
		profileEq.mockResolvedValue({ error: null });

		await updateDisplayName("  Ada Lovelace  ");

		/* Trimmed — the field is free text, and a name padded with the spaces
		   someone's browser autocompleted is not the name they meant to save. */
		expect(updateUser).toHaveBeenCalledWith({
			data: { full_name: "Ada Lovelace" },
		});
		expect(profileUpdate).toHaveBeenCalledWith({
			display_name: "Ada Lovelace",
		});
		expect(profileEq).toHaveBeenCalledWith("id", "u1");
	});

	it("stops at the auth update when that half fails", async () => {
		updateUser.mockResolvedValue({
			data: { user: null },
			error: { message: "Session expired." },
		});

		await expect(updateDisplayName("Ada")).rejects.toThrow("Session expired.");
		expect(profileUpdate).not.toHaveBeenCalled();
	});

	it("surfaces a failure to save the profile half", async () => {
		updateUser.mockResolvedValue({
			data: { user: { id: "u1" } },
			error: null,
		});
		profileUpdate.mockReturnValue({ eq: profileEq });
		profileEq.mockResolvedValue({
			error: { message: "The database is behind the app." },
		});

		await expect(updateDisplayName("Ada")).rejects.toThrow(
			"The database is behind the app.",
		);
	});
});

describe("deleteOwnAccount", () => {
	it("calls the definer function that does the deleting", async () => {
		rpc.mockResolvedValue({ error: null });

		await deleteOwnAccount();

		expect(rpc).toHaveBeenCalledWith("delete_own_account");
	});

	it("throws rather than leaving a failed delete looking successful", async () => {
		rpc.mockResolvedValue({ error: { message: "not signed in" } });

		await expect(deleteOwnAccount()).rejects.toThrow("not signed in");
	});
});
