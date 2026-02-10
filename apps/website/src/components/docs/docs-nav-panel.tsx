"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { docsNavigation } from "@/lib/docs";

type DocsNavPanelProps = {
  navigation: typeof docsNavigation;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
};

export function DocsNavPanel({
  navigation,
  isOpen,
  onClose,
  triggerRef,
}: DocsNavPanelProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  // Only expand the first section by default
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navigation.length > 0 ? [navigation[0].slug] : [],
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside (but not on trigger button)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef?.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  const toggleSection = (slug: string) => {
    setExpandedSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const currentSlug = pathname.split("/").pop();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          className={cn(
            "absolute bottom-full left-0 right-0 mb-2 w-full z-[100]",
            "bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg",
            "max-h-80 overflow-y-auto",
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          )}
        >
          {/* Navigation */}
          <div className="p-3 space-y-1">
            {navigation.map((section) => (
              <div key={section.slug}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.slug)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span>{section.title}</span>
                  <Icons.ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      expandedSections.includes(section.slug)
                        ? "rotate-180"
                        : "",
                    )}
                  />
                </button>

                {expandedSections.includes(section.slug) && (
                  <div className="mt-1 mb-2 ml-2 pl-3 border-l border-border/50">
                    {section.docs.map((doc) => (
                      <Link
                        key={doc.slug}
                        href={`/docs/${doc.slug}`}
                        onClick={onClose}
                        className={cn(
                          "block px-2 py-1 text-sm transition-colors",
                          currentSlug === doc.slug
                            ? "text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {doc.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
