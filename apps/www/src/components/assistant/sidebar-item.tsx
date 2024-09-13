import { cn } from "@midday/ui/cn";

interface SidebarItemProps {
  chat: any;
  onSelect: (message: string) => void;
}

export function SidebarItem({ chat, onSelect }: SidebarItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg px-0 py-1 text-left text-[#878787] transition-colors hover:text-primary",
      )}
      onClick={() => onSelect(chat.title)}
    >
      <span className="line-clamp-1 text-xs">{chat.title}</span>
    </button>
  );
}
