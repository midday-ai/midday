import { ConnectionStatus } from "@/components/connection-status";
import { NotificationCenter } from "@/components/notification-center";
import { OpenSearchButton } from "@/components/search/open-search-button";
import { Trial } from "@/components/trial";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    <header className="md:m-0 z-10 px-6 md:border-b h-[70px] flex justify-between items-center desktop:sticky desktop:top-0 desktop:bg-background sticky md:static top-0 backdrop-filter backdrop-blur-xl md:backdrop-filter md:backdrop-blur-none dark:bg-[#121212] bg-[#fff] bg-opacity-70 ">
      <MobileMenu />

      <OpenSearchButton />

      <div className="flex space-x-2 ml-auto">
        <Trial />
        <ConnectionStatus />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
