import { getUserDetails } from "@midday/supabase/server";
import Image from "next/image";
import { SignOut } from "./sign-out";

export async function UserMenu() {
	const user = await getUserDetails();

	return (
		<div className="px-4 py-6 flex space-x-2">
			<Image
				src={user.avatar_url}
				width={24}
				height={24}
				className="rounded-full"
				alt={user.full_name}
			/>
			<SignOut />
		</div>
	);
}
