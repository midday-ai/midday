import { createServerComponentClient } from "@midday/supabase";
import { cookies } from "next/headers";
import Image from "next/image";
import { SignOut } from "./sign-out";

export async function UserMenu() {
	const supabase = createServerComponentClient({ cookies });

	const {
		data: { session },
	} = await supabase.auth.getSession();

	return (
		<div className="px-4 py-6 flex space-x-2">
			<Image
				src={session?.user.user_metadata.avatar_url}
				width={24}
				height={24}
				className="rounded-full"
				alt={session?.user.user_metadata.full_name}
			/>
			<SignOut />
		</div>
	);
}
