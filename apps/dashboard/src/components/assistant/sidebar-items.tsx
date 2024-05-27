import type { Chat } from "@/actions/ai/types";
import { AnimatePresence, motion } from "framer-motion";
import { SidebarItem } from "./sidebar-item";
import { Toolbar } from "./toolbar";

interface SidebarItemsProps {
  chats?: Chat[];
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

const history = [
  {
    key: "yesterday",
    data: [
      {
        id: 1,
        title: "What's my current burn rate",
      },
      {
        id: 2,
        title: "Show all transactions with me",
      },
      {
        id: 3,
        title: "What did I spend on travel last",
      },
      {
        id: 3,
        title: "What did I spend on travel",
      },
    ],
  },
  {
    key: "last-7d",
    data: [
      {
        id: 1,
        title: "Find webflow receipts",
      },
      {
        id: 2,
        title: "Find webflow receipts",
      },
      {
        id: 3,
        title: "Find webflow receipts",
      },
    ],
  },
  {
    key: "last-30d",
    data: [
      {
        id: 1,
        title: "Find webflow receipts",
      },
      {
        id: 2,
        title: "Find webflow receipts",
      },
      {
        id: 3,
        title: "Find webflow receipts",
      },
      {
        id: 1,
        title: "Find webflow receipts",
      },
      {
        id: 2,
        title: "Find webflow receipts",
      },
      {
        id: 3,
        title: "Find webflow receipts",
      },
      {
        id: 1,
        title: "Find webflow receipts",
      },
      {
        id: 2,
        title: "Find webflow receipts",
      },
      {
        id: 3,
        title: "Find webflow receipts",
      },
      {
        id: 1,
        title: "Find webflow receipts",
      },
      {
        id: 2,
        title: "Find webflow receipts",
      },
      {
        id: 3,
        title: "Find webflow receipts",
      },
    ],
  },
];

const formatRange = (key: string) => {
  switch (key) {
    case "yesterday":
      return "Yesterday";
    case "last-7d":
      return "Last 7 days";
    case "last-30d":
      return "Last 30 days";
    default:
      return null;
  }
};

const listVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export function SidebarItems({
  chats,
  onSelect,
  onNewChat,
}: SidebarItemsProps) {
  return (
    <div className="overflow-auto h-[410px] mt-16 flex flex-col space-y-6 scrollbar-hide p-4 pt-0 pb-[50px]">
      <AnimatePresence>
        <motion.div variants={listVariant} initial="hidden" animate="show">
          {history.map((history) => {
            return (
              <div key={history.key}>
                <span className="font-mono text-[#878787] text-xs">
                  {formatRange(history.key)}
                </span>

                <div className="mt-1 flex flex-col space-y-1">
                  {history.data.map((chat) => {
                    return (
                      <SidebarItem
                        key={chat.id}
                        chat={chat}
                        onSelect={onSelect}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>

        <Toolbar onNewChat={onNewChat} />
      </AnimatePresence>
    </div>
  );
}
