import type { Chat } from "@/actions/ai/types";

interface SidebarItemProps {
  chat: Chat;
  onSelect: (id: string) => void;
}

export function SidebarItem({ chat, onSelect }: SidebarItemProps) {
  return (
    <button
      type="button"
      className="p-0 text-left"
      onClick={() => onSelect(chat.id)}
    >
      <span className="text-xs line-clamp-1">{chat.title}</span>
    </button>
  );
}
