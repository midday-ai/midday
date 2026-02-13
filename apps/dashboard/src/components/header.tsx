import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";
import { ConnectionStatus } from "@/components/connection-status";
import { NotificationCenter } from "@/components/notification-center";
import { OpenSearchButton } from "@/components/search/open-search-button";
import { Trial } from "@/components/trial";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "./mobile-menu";

function UserMenuSkeleton() {
  return <Skeleton className="w-8 h-8 rounded-full" />;
}

export function Header() {
  return (
    <header
      className="md:m-0 z-50 px-6 md:border-b h-[70px] flex justify-between items-center top-0 backdrop-filter backdrop-blur-xl md:backdrop-filter md:backdrop-blur-none bg-background bg-opacity-70 desktop:rounded-t-[10px] transition-transform"
      style={{
        transform: "translateY(calc(var(--header-offset, 0px) * -1))",
        transitionDuration: "var(--header-transition, 200ms)",
        willChange: "transform",
      }}
    >
      <MobileMenu />

      <OpenSearchButton />

      <div className="flex space-x-2 ml-auto">
        <Suspense>
          <Trial />
        </Suspense>
        <ConnectionStatus />
        <NotificationCenter />
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
