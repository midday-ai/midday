import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { MainMenu } from "./main-menu";

export function Sidebar() {
  return (
    <aside className="w-[55px] h-screen flex-shrink-0 flex-col justify-between flex sticky top-0 ml-4">
      <div className="flex flex-col items-center justify-center">
        <div className="mt-6">
          <Link href="/">
            <Icons.LogoSmall />
          </Link>
        </div>
        <MainMenu />
      </div>
    </aside>
  );
}
