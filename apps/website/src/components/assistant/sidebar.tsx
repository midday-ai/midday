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
          "w-[220px] h-full md:h-[422px] bg-background dark:bg-[#131313] absolute -left-[220px] top-0 bottom-[1px] duration-200 ease-out transition-all border-border border-r-[1px] z-20 invisible",
          isExpanded && "visible translate-x-full"
        )}
      >
        <Toolbar onNewChat={onNewChat} />
        <SidebarItems onSelect={onSelect} />
        <div className="absolute z-10 h-full md:h-[422px] w-[45px] bg-gradient-to-r from-background/30 dark:from-[#131313]/30 to-background right-0 top-0 pointer-events-none" />
      </div>

      <div
        className={cn(
          "duration-200 ease-out transition-all z-10 absolute left-[1px] right-[1px] top-[1px] bottom-[1px] invisible opacity-0 bg-background",
          isExpanded && "visible opacity-80"
        )}
      />
    </div>
  );
}
