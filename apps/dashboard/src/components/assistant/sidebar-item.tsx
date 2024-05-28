import type { Chat } from "@/actions/ai/types";
import { cn } from "@midday/ui/cn";

interface SidebarItemProps {
  chat: Chat;
  chatId?: string;
  onSelect: (id: string) => void;
}

export function SidebarItem({ chat, chatId, onSelect }: SidebarItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "text-left transition-colors px-0 py-2 rounded-lg w-full opacity-60 hover:opacity-100",
        chatId === chat.id && "opacity-100"
      )}
      onClick={() => onSelect(chat.id)}
    >
      <span className="text-xs line-clamp-1">{chat.title}</span>
    </button>
  );
}
