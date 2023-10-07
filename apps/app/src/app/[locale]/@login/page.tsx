import { GoogleSignIn } from "@/components/google-sign-in";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export default function Login() {
	return (
		<div>
			<div className="absolute left-10 top-10">
				<Link href="https://midday.ai">
					<Icons.Logo />
				</Link>
			</div>

			<div className="flex min-h-screen justify-center items-center">
				<div className="pointer-events-none relative z-20 m-auto flex w-full max-w-[380px] flex-col">
					<div className="flex w-full flex-col relative">
						<div className="w-[2px] h-[2px] bg-white rounded-full absolute -top-[20px] -left-[100px] animate-[pulse_2s_ease-in-out_infinite]" />
						<div className="w-[3px] h-[3px] bg-white rounded-full absolute -top-[70px] left-[5%] animate-[pulse_2s_ease-in-out_infinite]" />
						<div
							className="w-[5px] h-[5px] bg-white rounded-full absolute -top-[120px] left-[80px] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "500ms" }}
						/>
						<div
							className="w-[5px] h-[5px] bg-white rounded-full absolute -top-[80px] left-[180px] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "0ms" }}
						/>
						<div
							className="w-[3px] h-[3px] bg-white rounded-full absolute -top-[20px] -right-[40px] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "200ms" }}
						/>
						<div
							className="w-[2px] h-[2px] bg-white rounded-full absolute -top-[100px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "2s" }}
						/>

						<div
							className="w-[5px] h-[5px] bg-white rounded-full absolute top-[80px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "0ms" }}
						/>

						{/* 
						<div
							className="w-[1px] h-[1px] bg-white rounded-full absolute top-[41%] left-[15%] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "0ms" }}
						/>
						<div
							className="w-[2px] h-[2px] bg-white rounded-full absolute top-[39%] left-[25%] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "700ms" }}
						/>
						<div
							className="w-[5px] h-[5px] bg-[#22FF66] rounded-full absolute top-[44%] left-[30%] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "1s" }}
						/>
						<div
							className="w-[1px] h-[1px] bg-white rounded-full absolute top-[45%] left-[44%] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "400ms" }}
						/>

						<div
							className="w-[5px] h-[5px] bg-white rounded-full absolute top-[54%] right-[5%] animate-[pulse_2s_ease-in-out_infinite]"
							style={{ animationDelay: "2s" }}
						/> */}

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
