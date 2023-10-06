"use client";

import type { ComponentProps } from "react";

export function SignIn({
	provider,
	...props
}: { provider } & ComponentProps<"button">) {
	return (
		<button
			type="button"
			{...props}
			onClick={() => console.log("sign in")}
			className="appearance-none font-semibold scale-100 active:scale-[0.98] flex w-full items-center justify-center rounded-xl bg-gray-800 px-10 py-4 text-gray-100 transition-colors duration-150 hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-gray-200"
		/>
	);
}
