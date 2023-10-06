import { GoogleSignIn } from "@/components/google-sign-in";
import { Logo } from "@midday/ui/logo";
import Link from "next/link";

export default function Login() {
	return (
		<div>
			<div className="absolute left-10 top-10">
				<Link href="https://midday.ai">
					<Logo />
				</Link>
			</div>
			<div className="flex min-h-screen justify-center items-center">
				<div className="pointer-events-none relative z-20 m-auto flex w-full max-w-[380px] flex-col">
					<div className="flex w-full flex-col">
						<div className="pb-4 bg-gradient-to-r from-white via-white to-[#848484] inline-block text-transparent bg-clip-text">
							<h1 className="font-bold pb-1 text-3xl">Login to midday.</h1>
						</div>

						<p className="font-bold pb-1 text-2xl text-[#606060]">
							Automate financial tasks, <br /> stay organized, and make
							<br />
							informed decisions
							<br /> effortlessly.
						</p>

						<div className="pointer-events-auto mt-6 flex flex-col mb-4">
							<GoogleSignIn />
						</div>

						<p className="text-xs text-[#606060]">
							By clicking Continue with Google, you acknowledge that you have
							read and understood, and agree to Midday's and Privacy Policy.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
