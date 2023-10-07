"use client";

import { cn } from "@midday/ui";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainMenu() {
	const pathname = usePathname();
	const part = pathname?.split("/")[1];

	const items = [
		{
			path: "/",
			name: "Overview",
			icon: Icons.Overview,
		},
		{
			path: "/transactions",
			name: "Transactions",
			icon: Icons.Transactions,
		},
		{
			path: "/accounts",
			name: "Accounts",
			icon: Icons.Accounts,
		},
	];

	return (
		<nav className="mt-6 px-4">
			<ul className="flex flex-col gap-2">
				{items.map((item) => {
					const { path, name, icon: Icon } = item;
					const isActive =
						(pathname === "/" && path === "/") ||
						(pathname !== "/" && path.startsWith(`/${part}`));

					return (
						<li
							key={path}
							className={cn(
								"py-2 px-4 rounded-md border border-transparent",
								isActive && "bg-[#1D1D1D] border-[#2C2C2C]",
							)}
						>
							<Link
								href={path}
								className="flex items-center space-x-2 text-white"
							>
								<Icon />
								<span className="text-sm">{name}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
