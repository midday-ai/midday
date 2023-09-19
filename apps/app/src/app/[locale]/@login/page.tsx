import { SignIn } from "@/components/sing-in";

export default function Login() {
	return (
		<div className="flex min-h-screen justify-center items-center bg-zinc-900">
			<div className="pointer-events-none relative z-20 m-auto flex w-full max-w-[520px] flex-col">
				<div className="flex w-full flex-col p-12">
					<p className="text-white pointer-events-auto text-4xl font-semibold leading-tight">
						Joyful and productive collaboration.&nbsp;
						<span className="text-primary">
							All in one
							<a
								href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
								rel="noopener noreferrer"
								target="_blank"
							>
								.
							</a>
						</span>
					</p>
					<div className="pointer-events-auto mt-6 flex flex-col">
						<SignIn provider="google">Sign in with Google</SignIn>
					</div>
				</div>
			</div>
		</div>
	);
}
