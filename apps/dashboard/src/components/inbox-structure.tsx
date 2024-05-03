import { Tabs } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useQueryState } from "nuqs";
import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxListSkeleton } from "./inbox-list-skeleton";

type Props = {
  isLoading?: boolean;
  headerComponent: React.ReactNode;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onChangeTab?: (tab: "done" | "todo") => void;
};

export function InboxStructure({
  headerComponent,
  leftComponent,
  rightComponent,
  onChangeTab,
  isLoading,
}: Props) {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "todo",
  });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row space-x-8 mt-4">
        <div className="w-full h-[calc(100vh-120px)] relative overflow-hidden">
          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value);
              onChangeTab?.(value);
            }}
          >
            {headerComponent}
            {isLoading ? (
              <InboxListSkeleton numberOfItems={12} />
            ) : (
              leftComponent
            )}
          </Tabs>
        </div>
        {isLoading ? <InboxDetailsSkeleton /> : rightComponent}
      </div>
    </TooltipProvider>
  );
}
