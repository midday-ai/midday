import { cn } from "@midday/ui/cn";

interface SidebarItemProps {
  chat: any;
  chatId?: string;
  onSelect: (id: string) => void;
}

export function SidebarItem({ chat, chatId, onSelect }: SidebarItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "text-left transition-colors px-0 py-1 rounded-lg w-full text-[#878787] hover:text-primary",
        chatId === chat.id && "text-primary"
      )}
      onClick={() => onSelect(chat.id)}
    >
      <span className="text-xs line-clamp-1">{chat.title}</span>
    </button>
  );
}
