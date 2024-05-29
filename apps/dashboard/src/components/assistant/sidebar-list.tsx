import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useClickAway } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { SidebarItems } from "./sidebar-items";
import { Toolbar } from "./toolbar";

type Props = {
  isExpanded: boolean;
  chatId?: string;
  setExpanded: (value: boolean) => void;
  setOpen: (value: boolean) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export function SidebarList({
  isExpanded,
  chatId,
  setExpanded,
  setOpen,
  onSelect,
  onNewChat,
}: Props) {
  const ref = useClickAway(() => {
    setExpanded(false);
  });

  const router = useRouter();

  const navigateToSettings = () => {
    setOpen(false);
    router.push("/account/assistant");
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn(
          "w-[220px] h-[477px] bg-background dark:bg-[#131313] absolute -left-[220px] top-0 bottom-[1px] duration-200 ease-out transition-all border-border border-r-[1px] z-20 invisible",
          isExpanded && "visible translate-x-full"
        )}
      >
        <Button
          variant="outline"
          size="icon"
          className="size-8 z-50 absolute right-4 top-3"
          onClick={navigateToSettings}
        >
          <Icons.Settings size={18} />
        </Button>

        <SidebarItems onSelect={onSelect} chatId={chatId} />
        <Toolbar onNewChat={onNewChat} />

        <div className="absolute z-10 h-[477px] w-[30px] bg-background/95 right-0 top-0 pointer-events-none" />
      </div>

      <div
        className={cn(
          "duration-200 ease-out transition-all z-10 fixed left-[1px] right-[1px] top-[1px] bottom-[1px] invisible opacity-0 bg-background",
          isExpanded && "visible opacity-80"
        )}
      />
    </div>
  );
}
