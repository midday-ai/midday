import { Icons } from "@midday/ui/icons";
import { MainMenu } from "./main-menu";
import { UserMenu } from "./user-menu";

export function Sidebar() {
	return (
		<aside className="w-56 h-screen flex-shrink-0 flex-col justify-between md:flex">
			<div>
				<div className="flex h-[60px] items-center px-4">
					<Icons.LogoSmall />
				</div>
				<MainMenu />
			</div>

			<UserMenu />
		</aside>
	);
}
