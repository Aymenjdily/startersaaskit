import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@/components/auth/sign-in";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/sign-in")({
	head: () =>
		pageHead({
			path: "/sign-in",
			title: "Sign in",
			description:
				"Sign in to generate a starter repository wired to the stack you already use.",
			noIndex: true,
		}),
	component: SignIn,
});
