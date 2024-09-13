import { cn } from "@midday/ui/cn";
import { useClickAway } from "@uidotdev/usehooks";

import { SidebarItems } from "./sidebar-items";
import { Toolbar } from "./toolbar";

type Props = {
  isExpanded: boolean;
  setExpanded: (value: boolean) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export function Sidebar({
  isExpanded,
  setExpanded,
  onSelect,
  onNewChat,
}: Props) {
  const ref = useClickAway(() => {
    setExpanded(false);
  });

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn(
          "invisible absolute -left-[220px] bottom-[1px] top-0 z-20 h-[422px] w-[220px] border-r-[1px] border-border bg-background transition-all duration-200 ease-out dark:bg-[#131313]",
          isExpanded && "visible translate-x-full",
        )}
      >
        <Toolbar onNewChat={onNewChat} />
        <SidebarItems onSelect={onSelect} />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-[422px] w-[45px] bg-gradient-to-r from-background/30 to-background dark:from-[#131313]/30" />
      </div>

      <div
        className={cn(
          "invisible absolute bottom-[1px] left-[1px] right-[1px] top-[1px] z-10 bg-background opacity-0 transition-all duration-200 ease-out",
          isExpanded && "visible opacity-80",
        )}
      />
    </div>
  );
}
