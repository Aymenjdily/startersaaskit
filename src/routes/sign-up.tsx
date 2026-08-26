import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@/components/auth/sign-up";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/sign-up")({
	head: () => ({ meta: [{ title: `Sign up · ${BRAND}` }] }),
	component: SignUp,
});
