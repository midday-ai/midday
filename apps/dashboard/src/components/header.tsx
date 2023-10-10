import { CommandMenu } from "@/components/command-menu";
import { Feedback } from "@/components/feedback";
import { NotificationCenter } from "@/components/notification-center";
import { UserMenu } from "@/components/user-menu";

export function Header() {
  return (
    <header className="border-b-[1px] flex justify-between py-4 mr-8">
      <CommandMenu />
      <div className="flex space-x-2">
        <Feedback />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
