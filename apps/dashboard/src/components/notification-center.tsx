import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/utils";

export function NotificationCenter() {
  const hasNotificaitons = false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 flex items-center"
        >
          <Icons.Notifications size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "rounded-xl h-[540px] w-[400px] mr-7",
          !hasNotificaitons && "flex justify-center items-center",
        )}
        sideOffset={10}
      >
        <div className="flex flex-col items-center space-y-4">
          {!hasNotificaitons && (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Icons.Inbox size={18} />
              </div>
              <p className="text-dark-gray text-sm">No new notifications</p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
