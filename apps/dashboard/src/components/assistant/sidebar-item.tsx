"use client";

import type { Chat } from "@/actions/ai/types";
// import { useLocalStorage } from '@/lib/hooks/use-local-storage'

interface SidebarItemProps {
  chat: Chat;
  onSelect: (id: string) => void;
}

export function SidebarItem({ chat, onSelect }: SidebarItemProps) {
  //   const [newChatId, setNewChatId] = useLocalStorage('newChatId', null)
  //   const shouldAnimate = index === 0 && isActive && newChatId

  return (
    <button
      type="button"
      className="p-0 text-left"
      onClick={() => onSelect("id")}
    >
      <span className="text-xs">{chat.title}</span>
    </button>
  );
}
