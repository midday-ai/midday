import { AssistantButton } from "@/components/assistant/button";
import { DesktopAssistantuButton } from "@/components/assistant/button-desktop";
import { NotificationCenter } from "@/components/notification-center";
import { ReconnectBank } from "@/components/reconnect-bank";
import { TrackerControl } from "@/components/tracker-contol";
import { UserMenu } from "@/components/user-menu";
import { BrowserNavigation } from "@/desktop/components/browser-navigation";
import { Skeleton } from "@midday/ui/skeleton";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { Suspense } from "react";
import { DesktopTrafficLight } from "./desktop-traffic-light";

export function Header() {
  return (
    <header className="border-b-[1px] flex justify-between py-4 items-center todesktop:sticky todesktop:top-0 todesktop:bg-background todesktop:z-10 todesktop:border-none">
      {isDesktopApp() && <DesktopTrafficLight />}
      {isDesktopApp() && <BrowserNavigation />}
      <AssistantButton />

      <div className="flex space-x-2 no-drag ml-auto">
        {isDesktopApp() && <DesktopAssistantuButton />}
        <TrackerControl />
        <Suspense>
          <ReconnectBank />
        </Suspense>
        <NotificationCenter />

        <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
