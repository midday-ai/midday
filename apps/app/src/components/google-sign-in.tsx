"use client";

import { createClientComponentClient } from "@midday/supabase";
import { Button } from "@midday/ui/button";

export function GoogleSignIn() {
	const supabase = createClientComponentClient();

	const handleSignIn = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${location.origin}/api/auth/callback`,
			},
		});
	};

	return (
		<Button
			onClick={handleSignIn}
			className="active:scale-[0.98] rounded-xl bg-white px-10 py-4 text-black"
		>
			Continue with Google
		</Button>
	);
}
