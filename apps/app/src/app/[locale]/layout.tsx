import { auth } from "@midday/auth";

export default async function Layout({
	dashboard,
	login,
}: {
	dashboard: React.ReactNode;
	login: React.ReactNode;
}) {
	const session = await auth();
	return session ? dashboard : login;
}
