import { BackButton } from "@/components/command-menu/back-button";
import { useNotifications } from "@/hooks/use-notifications";
import { CommandItem, CommandList } from "@midday/ui/command";
import { Skeleton } from "@midday/ui/skeleton";

export function CommandNotifications() {
  let content;

  const { notifications, isLoading } = useNotifications();

  const handleOnSelect = ({ type, recordId }) => {
    return {
      transaction: window.location.replace(
        `midday:///transactions?id=${recordId}`
      ),
      inbox: window.location.replace(`midday:///inbox?id=${recordId}`),
      match: window.location.replace(`midday:///transactions?id=${recordId}`),
    }[type];
  };

  if (isLoading) {
    content = [...Array(6)].map((_, index) => (
      <CommandItem key={index.toString()}>
        <Skeleton className="h-3 w-[340px]" />
      </CommandItem>
    ));
  }

  if (notifications) {
    content = notifications.map((notification) => (
      <CommandItem
        key={notification?.id}
        value={notification?.id}
        onSelect={() => handleOnSelect(notification?.payload)}
      >
        {notification?.payload?.description}
      </CommandItem>
    ));
  }

  return (
    <div className="h-full">
      <div className="p-5 flex items-center space-x-3">
        <BackButton />
        <h2>Latest Notifications</h2>
      </div>

      <CommandList>{content}</CommandList>
    </div>
  );
}
