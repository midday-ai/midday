import { SignOut } from "@/components/sign-out";

export default async function Dashboard() {
	return (
		<div className="flex min-h-screen justify-center items-center">
			<SignOut />
		</div>
	);
}
