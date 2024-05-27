import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useClickAway } from "@uidotdev/usehooks";
import { useRouter } from "next/navigation";
import { SidebarItems } from "./sidebar-items";

type Props = {
  isExpanded: boolean;
  setExpanded: (value: boolean) => void;
  setOpen: (value: boolean) => void;
};

export function SidebarList({ isExpanded, setExpanded, setOpen }: Props) {
  const ref = useClickAway(() => {
    setExpanded(false);
  });

  const router = useRouter();

  const navigateToSettings = () => {
    setOpen(false);
    router.push("/account/assistant");
  };

  const onSelect = () => {
    setExpanded(false);
  };

  const onNewChat = () => {
    setExpanded(false);
  };

  return (
    <div>
      <div
        ref={ref}
        className={cn(
          "w-[220px] h-[477px] bg-background absolute -left-[220px] top-[1px] bottom-[1px] duration-200 ease-out transition-all border-border border-r-[1px] z-20 invisible",
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

        <SidebarItems onSelect={onSelect} onNewChat={onNewChat} />
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
