"use client";

import { Icons } from "@midday/ui/icons";
import { flushSync } from "react-dom";
import { useChatState } from "@/components/chat/chat-context";
import { useInboxUpload } from "@/hooks/use-inbox-upload";

const CHAT_ACTIONS = [
  {
    label: "Create Invoice",
    icon: Icons.Invoice,
    message: "Create a new invoice",
  },
  {
    label: "Add Transaction",
    icon: Icons.CreateTransaction,
    message: "Add a new transaction",
  },
  {
    label: "Add Customer",
    icon: Icons.Customers,
    message: "Add a new customer",
  },
  {
    label: "Track Time",
    icon: Icons.Tracker,
    message: "Start tracking time",
  },
] as const;

const buttonClassName =
  "flex items-center gap-1.5 border bg-white border-[#e6e6e6] hover:bg-[#f7f7f7] hover:border-[#d0d0d0] dark:border-[#1d1d1d] dark:bg-[#0c0c0c] dark:hover:bg-[#0f0f0f] dark:hover:border-[#222222] px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-all duration-300 cursor-pointer group";

const iconClassName =
  "text-muted-foreground/40 group-hover:text-foreground transition-colors duration-300";

export function QuickActions({ onChatOpen }: { onChatOpen: () => void }) {
  const { sendMessage, setMessages, setChatTitle } = useChatState();
  const { openFilePicker } = useInboxUpload();

  const handleChatAction = (message: string) => {
    flushSync(() => {
      setMessages([]);
      setChatTitle(null);
    });
    sendMessage({ text: message });
    onChatOpen();
  };

  return (
    <div className="flex items-center justify-center gap-3 pt-2 pb-12 w-full flex-wrap">
      {CHAT_ACTIONS.map(({ label, icon: Icon, message }) => (
        <button
          key={label}
          type="button"
          data-track="Assistant Quick Action"
          data-action={label}
          className={buttonClassName}
          onClick={() => handleChatAction(message)}
        >
          <Icon size={13} className={iconClassName} />
          <span>{label}</span>
        </button>
      ))}

      <button
        type="button"
        data-track="Assistant Quick Action"
        data-action="Upload Receipt"
        className={buttonClassName}
        onClick={openFilePicker}
      >
        <Icons.Inbox2 size={13} className={iconClassName} />
        <span>Upload Receipt</span>
      </button>
    </div>
  );
}
