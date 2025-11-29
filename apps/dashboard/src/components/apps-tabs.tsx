"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";

export function AppsTabs() {
  const [currentTab, setTab] = useQueryState("tab", {
    defaultValue: "all",
  });

  return (
    <Tabs value={currentTab ?? "all"} onValueChange={setTab}>
      <TabsList className="h-9">
        <TabsTrigger value="all" className="h-full px-2 py-0 text-xs">
          All
        </TabsTrigger>
        <TabsTrigger value="installed" className="h-full px-2 py-0 text-xs">
          Installed
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
