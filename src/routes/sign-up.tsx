import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@/components/auth/sign-up";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/sign-up")({
	head: () =>
		pageHead({
			path: "/sign-up",
			title: "Sign up",
			description:
				"Create an account and generate your first starter. Free while in beta.",
			noIndex: true,
		}),
	component: SignUp,
});
