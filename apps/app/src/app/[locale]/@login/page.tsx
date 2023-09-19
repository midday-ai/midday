import { SignIn } from "@/components/auth";

export default function Login() {
	return (
		<SignIn
			provider="google"
			className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
		>
			Sign in with Google
		</SignIn>
	);
}
