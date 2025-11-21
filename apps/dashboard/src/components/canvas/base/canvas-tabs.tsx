"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useEffect, useRef, useState } from "react";

export interface CanvasTab {
  id: string;
  title: string;
  version: number;
}

interface CanvasTabsProps {
  tabs: CanvasTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onDownloadReport?: () => void;
}

export function CanvasTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onDownloadReport,
}: CanvasTabsProps) {
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMoreDropdown(false);
      }
    };

    if (showMoreDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreDropdown]);

  // Keyboard navigation for canvas tabs (Ctrl/Cmd + number keys, Arrow keys)
  useEffect(() => {
    if (tabs.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Arrow Left/Right to navigate tabs
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
        if (currentIndex > 0) {
          onTabChange(tabs[currentIndex - 1].id);
        } else {
          // Wrap to last tab
          onTabChange(tabs[tabs.length - 1].id);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
        if (currentIndex < tabs.length - 1) {
          onTabChange(tabs[currentIndex + 1].id);
        } else {
          // Wrap to first tab
          onTabChange(tabs[0].id);
        }
      }

      // Ctrl/Cmd + 1-9 to switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "9") {
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < tabs.length) {
          e.preventDefault();
          onTabChange(tabs[tabIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, activeTabId, onTabChange]);

  if (tabs.length <= 1) {
    return null; // Don't show tabs if only one
  }

  return (
    <div className="relative flex items-stretch bg-[#f7f7f7] dark:bg-[#131313] min-h-[32px]">
      {/* Tabs */}
      <div className="flex items-stretch flex-1 overflow-x-auto scrollbar-none">
        <style jsx>{`
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="flex items-stretch">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "group relative flex items-center gap-1.5 px-3 text-[12px] transition-all whitespace-nowrap h-full",
                  isActive
                    ? "text-black dark:text-white bg-white dark:bg-[#0c0c0c]"
                    : "text-[#707070] dark:text-[#666666] bg-[#f7f7f7] dark:bg-[#131313] hover:text-black dark:hover:text-white",
                )}
                style={{
                  border: "none",
                  marginBottom: isActive ? "-1px" : "0px",
                  position: "relative",
                  zIndex: isActive ? 10 : 1,
                }}
              >
                <span>{tab.title}</span>
                {/* Tab closing disabled - artifacts are managed by AI SDK */}
              </button>
            );
          })}
        </div>
      </div>

      {/* More Button */}
      <div className="relative px-2 py-2 flex-shrink-0" ref={moreDropdownRef}>
        <button
          onClick={() => setShowMoreDropdown(!showMoreDropdown)}
          className="w-6 h-6 flex items-center justify-center transition-colors duration-200 cursor-pointer hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]"
        >
          <Icons.MoreVertical
            size={16}
            className="text-[#707070] dark:text-[#666666] hover:text-black dark:hover:text-[#999999] transition-colors"
          />
        </button>
        {showMoreDropdown && (
          <div className="absolute right-0 top-full mt-2 w-40 shadow-lg z-[999999] bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d]">
            <div className="p-2">
              {onDownloadReport && (
                <button
                  onClick={() => {
                    onDownloadReport();
                    setShowMoreDropdown(false);
                  }}
                  className="w-full px-2 py-2 text-left transition-colors text-black dark:text-white hover:bg-[#f7f7f7] dark:hover:bg-[#131313]"
                >
                  <span className="text-sm">Download Report</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

