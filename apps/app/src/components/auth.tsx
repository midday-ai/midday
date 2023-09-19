import type { ComponentProps } from "react";

import type { OAuthProviders } from "@midday/auth";
import { CSRF_experimental } from "@midday/auth";

export function SignIn({
	provider,
	...props
}: { provider: OAuthProviders } & ComponentProps<"button">) {
	return (
		<form action={`/api/auth/signin/${provider}`} method="post">
			<button {...props} type="submit" />
			<CSRF_experimental />
		</form>
	);
}

export function SignOut(props: ComponentProps<"button">) {
	return (
		<form action="/api/auth/signout" method="post">
			<button {...props} type="submit" />
			<CSRF_experimental />
		</form>
	);
}
