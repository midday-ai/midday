import { SignOut } from "@/components/sign-out";
import { auth } from "@midday/auth";
import Image from "next/image";

export default async function Dashboard() {
	const session = await auth();

	return (
		<div className="flex min-h-screen justify-center items-center">
			{session.user.picture && (
				<Image
					src={session.user.picture}
					alt={session.user.name ?? "Profile"}
					width={40}
					height={40}
					className="rounded-full"
				/>
			)}
			<SignOut>Sign out</SignOut>
		</div>
	);
}
