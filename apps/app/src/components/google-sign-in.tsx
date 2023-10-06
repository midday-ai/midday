"use client";

import { createClientComponentClient } from "@midday/supabase";

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
		<button
			type="button"
			onClick={handleSignIn}
			className="appearance-none font-semibold scale-100 active:scale-[0.98] flex w-full items-center justify-center rounded-xl bg-gray-800 px-10 py-4 text-gray-100 transition-colors duration-150 hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-gray-200"
		>
			Continue with Google
		</button>
	);
}
