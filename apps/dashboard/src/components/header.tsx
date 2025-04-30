import { AssistantButton } from "@/components/assistant/button";
import { DesktopAssistantButton } from "@/components/assistant/button-desktop";
import { ConnectionStatus } from "@/components/connection-status";
import { NotificationCenter } from "@/components/notification-center";
import { Trial } from "@/components/trial";
import { UserMenu } from "@/components/user-menu";
import { BrowserNavigation } from "@/desktop/components/browser-navigation";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { DesktopTrafficLight } from "./desktop-traffic-light";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    <header className="-ml-4 -mr-4 md:m-0 z-10 px-4 md:px-0 md:border-b-[1px] flex justify-between pt-4 pb-2 md:pb-4 items-center todesktop:sticky todesktop:top-0 todesktop:bg-background todesktop:border-none sticky md:static top-0 backdrop-filter backdrop-blur-xl md:backdrop-filter md:backdrop-blur-none dark:bg-[#121212] bg-[#fff] bg-opacity-70 ">
      <MobileMenu />

      {isDesktopApp() && <DesktopTrafficLight />}
      {isDesktopApp() && <BrowserNavigation />}

      <AssistantButton />

      <div className="flex space-x-2 ml-auto">
        {isDesktopApp() && <DesktopAssistantButton />}

        <Trial />
        <ConnectionStatus />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
