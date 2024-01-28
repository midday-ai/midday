import { BackButton } from "@/components/command-menu/back-button";
import { useNotifications } from "@/hooks/use-notifications";
import { useCommandStore } from "@/store/command";
import { CommandItem, CommandList } from "@midday/ui/command";
import { Skeleton } from "@midday/ui/skeleton";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useRouter } from "next/navigation";

export function CommandNotifications() {
  let content;

  const { setOpen } = useCommandStore();
  const { notifications, isLoading } = useNotifications();
  const router = useRouter();

  const handleOnSelect = ({ type, recordId }) => {
    if (isDesktopApp()) {
      return {
        transaction: window.location.replace(
          `midday:///transactions?id=${recordId}`
        ),
        inbox: window.location.replace(`midday:///inbox?id=${recordId}`),
        match: window.location.replace(`midday:///transactions?id=${recordId}`),
      }[type];
    }

    setOpen();

    return {
      transaction: router.push(`/transactions?id=${recordId}`),
      inbox: router.push(`/inbox?id=${recordId}`),
      match: router.push(`/transactions?id=${recordId}`),
    }[type];
  };

  if (isLoading) {
    content = [...Array(8)].map((_, index) => (
      <CommandItem key={index.toString()}>
        <Skeleton className="h-3 w-[340px]" />
      </CommandItem>
    ));
  }

  if (notifications.length) {
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

      <CommandList className="p-2">{content}</CommandList>
    </div>
  );
}
