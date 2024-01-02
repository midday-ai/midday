"use client";

import { updateMenuAction } from "@/actions/update-menu-action";
import { useMenuStore } from "@/store/menu";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import { useClickAway } from "@uidotdev/usehooks";
import {
  AnimatePresence,
  Reorder,
  motion,
  useMotionValue,
} from "framer-motion";
import { useAction } from "next-safe-action/hook";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLongPress } from "use-long-press";

const icons = {
  "/": () => <Icons.Overview size={22} />,
  "/transactions": () => <Icons.Transactions size={22} />,
  "/invoices": () => <Icons.Invoice size={22} />,
  "/tracker": () => <Icons.Tracker size={22} />,
  "/vault": () => <Icons.Files size={22} />,
  "/settings": () => <Icons.Settings size={22} />,
  "/inbound": () => (
    <div className="relative">
      <div className="w-1.5 h-1.5 bg-[#d98d00] rounded-full absolute -top-1 -right-1" />
      <Icons.Inbox2 size={22} />
    </div>
  ),
};

const defaultItems = [
  {
    path: "/",
    name: "Overview",
  },
  {
    path: "/inbound",
    name: "Inbound",
  },
  {
    path: "/transactions",
    name: "Transactions",
  },
  {
    path: "/invoices",
    name: "Invoices",
  },
  {
    path: "/tracker",
    name: "Tracker",
  },
  {
    path: "/vault",
    name: "Vault",
  },
  {
    path: "/settings",
    name: "Settings",
  },
];

const Item = ({
  item,
  isActive,
  isCustomizing,
  onRemove,
  disableRemove,
  onDragEnd,
}) => {
  const y = useMotionValue(0);
  const Icon = icons[item.path];
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push(item.path)}>
      <Reorder.Item
        onDragEnd={onDragEnd}
        key={item.path}
        value={item}
        id={item.path}
        style={{ y }}
        className={cn(
          "relative rounded-lg border border-transparent w-[45px] h-[45px] flex items-center justify-center",
          "hover:bg-secondary hover:border-[#DCDAD2] hover:dark:border-[#2C2C2C]",
          isActive && "bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C]",
          isCustomizing &&
            "bg-background border-[#DCDAD2] dark:border-[#2C2C2C]"
        )}
      >
        <motion.div
          className="relative"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!disableRemove && isCustomizing && (
            <Button
              onClick={() => onRemove(item.path)}
              variant="ghost"
              size="icon"
              className="absolute -left-4 -top-4 w-4 h-4 p-0 rounded-full bg-border hover:bg-border hover:scale-150 z-10 transition-all"
            >
              <Icons.Remove className="w-3 h-3" />
            </Button>
          )}

          <div
            className={cn(
              "flex space-x-3 p-0 items-center",
              isCustomizing &&
                "animate-[jiggle_0.3s_ease-in-out_infinite] transform-gpu pointer-events-none"
            )}
          >
            <Icon />
          </div>
        </motion.div>
      </Reorder.Item>
    </button>
  );
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

export function MainMenu({ initialItems }) {
  const [items, setItems] = useState(initialItems ?? defaultItems);
  const { isCustomizing, setCustomizing } = useMenuStore();
  const pathname = usePathname();
  const part = pathname?.split("/")[1];
  const updateMenu = useAction(updateMenuAction);

  const hiddenItems = defaultItems.filter(
    (item) => !items.some((i) => i.path === item.path)
  );

  const onReorder = (items) => {
    setItems(items);
  };

  const onDragEnd = () => {
    updateMenu.execute(items);
  };

  const onRemove = (path: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.path !== path));
    updateMenu.execute(items.filter((item) => item.path !== path));
  };

  const onAdd = (item) => {
    const updatedItems = [...items, item];
    setItems(updatedItems);
    updateMenu.execute(updatedItems);
  };

  const bind = useLongPress(
    () => {
      setCustomizing(true);
    },
    {
      cancelOnMovement: 0,
    }
  );

  const ref = useClickAway(() => {
    setCustomizing(false);
  });

  return (
    <div className="mt-6" {...bind()} ref={ref}>
      <AnimatePresence>
        <nav>
          <Reorder.Group
            axis="y"
            onReorder={onReorder}
            values={items}
            className="flex flex-col gap-1.5"
          >
            {items.map((item) => {
              const isActive =
                (pathname === "/" && item.path === "/") ||
                (pathname !== "/" && item.path.startsWith(`/${part}`));

              return (
                <Item
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  isCustomizing={isCustomizing}
                  onRemove={onRemove}
                  disableRemove={items.length === 1}
                  onDragEnd={onDragEnd}
                />
              );
            })}
          </Reorder.Group>
        </nav>
      </AnimatePresence>

      {hiddenItems.length > 0 && isCustomizing && (
        <nav className="border-t-[1px] mt-6 pt-6">
          <motion.ul
            variants={listVariant}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-1.5"
          >
            {hiddenItems.map((item) => {
              const Icon = icons[item.path];

              return (
                <motion.li
                  variants={itemVariant}
                  key={item.path}
                  className={cn(
                    "rounded-lg border border-transparent w-[45px] h-[45px] flex items-center justify-center",
                    "hover:bg-secondary hover:border-[#DCDAD2] hover:dark:border-[#2C2C2C]",
                    "bg-background border-[#DCDAD2] dark:border-[#2C2C2C]"
                  )}
                >
                  <div className="relative">
                    <Button
                      onClick={() => onAdd(item)}
                      variant="ghost"
                      size="icon"
                      className="absolute -left-4 -top-4 w-4 h-4 p-0 rounded-full bg-border hover:bg-border hover:scale-150 z-10 transition-all"
                    >
                      <Icons.Add className="w-3 h-3" />
                    </Button>

                    <Icon />
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </nav>
      )}
    </div>
  );
}
