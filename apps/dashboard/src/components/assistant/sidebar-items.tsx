import { getChatsAction } from "@/actions/ai/chat/get-chats-action";
import type { Chat } from "@/actions/ai/types";
import { useEffect, useState } from "react";
import { SidebarItem } from "./sidebar-item";

interface SidebarItemsProps {
  onSelect: (id: string) => void;
}

const formatRange = (key: string) => {
  switch (key) {
    case "1d":
      return "Today";
    case "2d":
      return "Yesterday";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    default:
      return null;
  }
};

export function SidebarItems({ onSelect }: SidebarItemsProps) {
  const [items, setItems] = useState<Chat[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const result = await getChatsAction();

      if (result) {
        setItems(result);
      }
    }

    if (!items.length && !isLoading) {
      fetchData();
    }
  }, []);

  return (
    <div className="overflow-auto relative h-[410px] mt-16 scrollbar-hide p-4 pt-0 pb-[50px] flex flex-col space-y-6">
      {Object.keys(items).map((key) => {
        const section = items[key];

        return (
          <div key={key}>
            {section?.length > 0 && (
              <div className="sticky">
                <span className="font-mono text-[#878787] text-xs">
                  {formatRange(key)}
                </span>
              </div>
            )}

            <div className="mt-2 flex flex-col space-y-3">
              {section?.map((chat) => {
                return (
                  <SidebarItem key={chat.id} chat={chat} onSelect={onSelect} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
