import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { MainMenu } from "./main-menu";

export function Sidebar() {
  return (
    <aside className="w-[55px] xl:w-[230px] h-screen flex-shrink-0 flex-col justify-between flex sticky top-0 ml-4">
      <div className="flex flex-col items-center justify-center xl:items-start xl:justify-start">
        <div className="mt-6 xl:ml-4">
          <Link href="/">
            <Icons.LogoSmall />
          </Link>
        </div>
        <MainMenu />
      </div>
    </aside>
  );
}
