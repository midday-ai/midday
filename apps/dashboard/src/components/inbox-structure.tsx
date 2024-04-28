import { Tabs } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useQueryState } from "nuqs";

type Props = {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  onChangeTab?: (tab: "done" | "todo") => void;
};

export function InboxStructure({
  leftColumn,
  rightColumn,
  onChangeTab,
}: Props) {
  const [tab, setTab] = useQueryState("tab", {
    shallow: true,
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
            {leftColumn}
          </Tabs>
        </div>
        {rightColumn}
      </div>
    </TooltipProvider>
  );
}
