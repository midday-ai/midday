import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { MainMenu } from "./main-menu";

export function Sidebar() {
  return (
    <aside className="w-56 h-screen flex-shrink-0 flex-col justify-between flex">
      <div>
        <div className="px-6 mt-6">
          <Link href="/">
            <Icons.LogoSmall />
          </Link>
        </div>
        <MainMenu />
      </div>
    </aside>
  );
}
