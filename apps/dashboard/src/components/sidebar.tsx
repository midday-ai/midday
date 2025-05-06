import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { MainMenu } from "./main-menu";
import { TeamDropdown } from "./team-dropdown";

export function Sidebar() {
  return (
    <aside className="h-screen flex-shrink-0 flex-col justify-between fixed top-0 ml-4 pb-4 items-center hidden md:flex">
      <div className="flex flex-col items-center justify-center">
        <div className="mt-6 todesktop:mt-[35px]">
          <Link href="/">
            <Icons.LogoSmall />
          </Link>
        </div>

        <MainMenu />
      </div>

      <TeamDropdown />
    </aside>
  );
}
