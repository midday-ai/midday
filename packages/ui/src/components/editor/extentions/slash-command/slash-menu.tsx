"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { cn } from "../../../../utils/cn";
import type { SlashCommandItem, SlashCommandSubItem } from "./types";

export type SlashMenuRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type SlashMenuProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem | SlashCommandSubItem) => void;
};

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [submenuSelectedIndex, setSubmenuSelectedIndex] = useState(0);

    // Get current item and its submenu items
    const currentItem = items[selectedIndex];
    const submenuItems = currentItem?.submenuItems ?? [];

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (!item) return;

        if (item.hasSubmenu && item.submenuItems?.length) {
          // Open submenu - also update selectedIndex to ensure currentItem
          // is correct on touch devices where onMouseEnter doesn't fire before onClick
          setSelectedIndex(index);
          setActiveSubmenu(item.id);
          setSubmenuSelectedIndex(0);
        } else {
          // Execute command directly
          command(item);
        }
      },
      [items, command],
    );

    const selectSubmenuItem = useCallback(
      (index: number) => {
        if (!currentItem?.submenuItems) return;
        const subItem = currentItem.submenuItems[index];
        if (subItem) {
          command(subItem);
        }
      },
      [currentItem, command],
    );

    const upHandler = useCallback(() => {
      if (activeSubmenu) {
        setSubmenuSelectedIndex(
          (prev) => (prev - 1 + submenuItems.length) % submenuItems.length,
        );
      } else {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    }, [activeSubmenu, items.length, submenuItems.length]);

    const downHandler = useCallback(() => {
      if (activeSubmenu) {
        setSubmenuSelectedIndex((prev) => (prev + 1) % submenuItems.length);
      } else {
        setSelectedIndex((prev) => (prev + 1) % items.length);
      }
    }, [activeSubmenu, items.length, submenuItems.length]);

    const enterHandler = useCallback(() => {
      if (activeSubmenu) {
        selectSubmenuItem(submenuSelectedIndex);
      } else {
        selectItem(selectedIndex);
      }
    }, [
      activeSubmenu,
      selectedIndex,
      submenuSelectedIndex,
      selectItem,
      selectSubmenuItem,
    ]);

    const rightHandler = useCallback(() => {
      const item = items[selectedIndex];
      if (item?.hasSubmenu && item.submenuItems?.length) {
        setActiveSubmenu(item.id);
        setSubmenuSelectedIndex(0);
      }
    }, [items, selectedIndex]);

    const leftHandler = useCallback(() => {
      if (activeSubmenu) {
        setActiveSubmenu(null);
        setSubmenuSelectedIndex(0);
      }
    }, [activeSubmenu]);

    useEffect(() => {
      setSelectedIndex(0);
      setActiveSubmenu(null);
      setSubmenuSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        if (event.key === "ArrowRight") {
          rightHandler();
          return true;
        }

        if (event.key === "ArrowLeft") {
          leftHandler();
          return true;
        }

        if (event.key === "Escape") {
          if (activeSubmenu) {
            setActiveSubmenu(null);
            return true;
          }
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return null;
    }

    return (
      <div className="relative">
        {/* Main menu */}
        <div className="z-50 min-w-[180px] overflow-hidden border border-border bg-background p-1 text-popover-foreground shadow-md">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-2 py-1.5 text-[11px] outline-none cursor-pointer",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => selectItem(index)}
              onMouseEnter={() => {
                setSelectedIndex(index);
                // Auto-open submenu on hover
                if (item.hasSubmenu && item.submenuItems?.length) {
                  setActiveSubmenu(item.id);
                  setSubmenuSelectedIndex(0);
                } else {
                  setActiveSubmenu(null);
                }
              }}
            >
              <span className="flex items-center gap-2">
                {item.icon && (
                  <span className="text-muted-foreground">{item.icon}</span>
                )}
                <span>{item.label}</span>
              </span>
              {item.hasSubmenu && (
                <span className="ml-2 text-muted-foreground">›</span>
              )}
            </button>
          ))}
        </div>

        {/* Submenu */}
        {activeSubmenu &&
          currentItem?.submenuItems &&
          currentItem.submenuItems.length > 0 && (
            <div className="absolute left-full top-0 ml-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto overflow-hidden border border-border bg-background p-1 text-popover-foreground shadow-md">
              {currentItem.submenuItems.map((subItem, index) => (
                <button
                  key={subItem.id}
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-start px-2 py-1.5 text-[11px] outline-none cursor-pointer",
                    index === submenuSelectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => selectSubmenuItem(index)}
                  onMouseEnter={() => setSubmenuSelectedIndex(index)}
                >
                  <span className="font-medium">{subItem.label}</span>
                  {subItem.description && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-full">
                      {subItem.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
      </div>
    );
  },
);

SlashMenu.displayName = "SlashMenu";
