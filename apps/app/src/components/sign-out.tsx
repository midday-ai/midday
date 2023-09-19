import type { OAuthProviders } from "@midday/auth";
import { CSRF_experimental } from "@midday/auth";
import type { ComponentProps } from "react";

export function SignOut(props: ComponentProps<"button">) {
	return (
		<form action="/api/auth/signout" method="post">
			<button {...props} type="submit" />
			<CSRF_experimental />
		</form>
	);
}
