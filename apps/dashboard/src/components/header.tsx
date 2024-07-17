import { AssistantButton } from "@/components/assistant/button";
import { DesktopAssistantButton } from "@/components/assistant/button-desktop";
import { NotificationCenter } from "@/components/notification-center";
import { ReconnectBank } from "@/components/reconnect-bank";
import { TrackerControl } from "@/components/tracker-contol";
import { UserMenu } from "@/components/user-menu";
import { BrowserNavigation } from "@/desktop/components/browser-navigation";
import { Skeleton } from "@midday/ui/skeleton";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { Suspense } from "react";
import { ConnectionError } from "./connection-error";
import { DesktopTrafficLight } from "./desktop-traffic-light";
import { FeedbackForm } from "./feedback-form";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    <header className="-ml-4 -mr-4 md:m-0 z-10 px-4 md:px-0 md:border-b-[1px] flex justify-between pt-4 pb-2 md:pb-4 items-center todesktop:sticky todesktop:top-0 todesktop:bg-background todesktop:border-none sticky md:static top-0 backdrop-filter backdrop-blur-xl md:backdrop-filter md:backdrop-blur-none dark:bg-[#121212] bg-[#fff] bg-opacity-70 ">
      <MobileMenu />

      {isDesktopApp() && <DesktopTrafficLight />}
      {isDesktopApp() && <BrowserNavigation />}

      <AssistantButton />

      <div className="flex space-x-2 no-drag ml-auto">
        {isDesktopApp() && <DesktopAssistantButton />}

        <FeedbackForm />

        <TrackerControl />

        <Suspense>
          <ConnectionError />
        </Suspense>

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
