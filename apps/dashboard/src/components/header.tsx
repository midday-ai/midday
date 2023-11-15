import { CommandMenu } from "@/components/command-menu";
import { NotificationCenter } from "@/components/notification-center";
import { ReconnectBank } from "@/components/reconnect-bank";
import { UserMenu } from "@/components/user-menu";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";

export function Header() {
  return (
    <header className="border-b-[1px] flex justify-between py-4">
      <CommandMenu />
      <div className="flex space-x-2">
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
