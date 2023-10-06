import { createServerComponentClient } from "@midday/supabase";
import { cookies } from "next/headers";

export default async function Layout({
	dashboard,
	login,
}: {
	dashboard: React.ReactNode;
	login: React.ReactNode;
}) {
	const supabase = createServerComponentClient({ cookies });

	const {
		data: { session },
	} = await supabase.auth.getSession();

	return session ? dashboard : login;
}
