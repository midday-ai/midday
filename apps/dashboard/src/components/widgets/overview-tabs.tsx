"use client";

import { useOverviewTab } from "@/hooks/use-overview-tab";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import type { ReactNode } from "react";

interface OverviewTabsProps {
  children: ReactNode;
}

export function OverviewTabs({ children }: OverviewTabsProps) {
  const { tab, setTab } = useOverviewTab();

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="h-8">
        <TabsTrigger value="overview" className="px-2 py-1 text-xs">
          Overview
        </TabsTrigger>
        <TabsTrigger value="metrics" className="px-2 py-1 text-xs">
          Metrics
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
