"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { BrokerOverview } from "./broker-overview";

export function BrokerHomeGuard({ children }: { children: React.ReactNode }) {
  const { isBroker } = usePermissions();

  if (isBroker) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-medium mb-6">Overview</h2>
        <BrokerOverview />
      </div>
    );
  }

  return <>{children}</>;
}
