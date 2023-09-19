import { SignIn } from "@/components/sing-in";

export default function Login() {
	return (
		<div className="flex min-h-screen justify-center items-center bg-zinc-900">
			<SignIn provider="google">Sign in with Google</SignIn>
		</div>
	);
}
