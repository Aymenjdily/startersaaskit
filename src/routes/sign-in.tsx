import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@/components/auth/sign-in";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/sign-in")({
	head: () => ({ meta: [{ title: `Sign in · ${BRAND}` }] }),
	component: SignIn,
});
