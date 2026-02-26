"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { Button } from "@midday/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@midday/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

type Props = {
  merchant: {
    name: string;
    team?: {
      name?: string | null;
      logoUrl?: string | null;
    } | null;
  };
  portalId: string;
};

export function PortalHeader({ merchant, portalId }: Props) {
  const trpc = useTRPC();

  const { data: unreadCount = 0 } = useQuery(
    trpc.merchantPortal.getUnreadCount.queryOptions({ portalId }),
  );

  const { data: notifications = [] } = useQuery(
    trpc.merchantPortal.getNotifications.queryOptions({
      portalId,
      limit: 10,
    }),
  );

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {merchant.team?.logoUrl && (
            <Image
              src={merchant.team.logoUrl}
              alt={merchant.team.name || "Logo"}
              width={32}
              height={32}
              className="object-contain flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{merchant.name}</div>
            {merchant.team?.name && (
              <div className="text-[10px] text-muted-foreground truncate">
                {merchant.team.name}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-[48px] min-w-[48px]"
              >
                <Icons.Notifications className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-[#FF3638] text-white text-[9px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border ${
                        n.readInPortal
                          ? "bg-background"
                          : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {n.message}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
