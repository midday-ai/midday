import { CommandMenu } from "@/components/command-menu";
import { Feedback } from "@/components/feedback";
import { NotificationCenter } from "@/components/notification-center";
import { UserMenu } from "@/components/user-menu";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";

export function Header() {
  return (
    <header className="border-b-[1px] flex justify-between py-4">
      <CommandMenu />
      <div className="flex space-x-2">
        <Feedback />
        <NotificationCenter />
        <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
