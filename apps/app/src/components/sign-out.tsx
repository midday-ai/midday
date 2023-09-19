"use client";

import { signOut } from "next-auth/react";
import type { ComponentProps } from "react";

export function SignOut(props: ComponentProps<"button">) {
	return <button {...props} type="button" onClick={() => signOut()} />;
}
