"use client";

import type { ComponentProps } from "react";

export function SignOut(props: ComponentProps<"button">) {
	return (
		<button {...props} type="button" onClick={() => console.log("sign out")} />
	);
}
