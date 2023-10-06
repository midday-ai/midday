import Link from "next/link";

export function MainMenu() {
	return (
		<nav className="mt-6 px-4">
			<ul className="flex flex-col gap-2">
				<li>
					<Link href="/">Overview</Link>
				</li>
				<li>
					<Link href="/transactions">Transactions</Link>
				</li>
			</ul>
		</nav>
	);
}
