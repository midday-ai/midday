"use client";

import type { docsNavigation } from "@/lib/docs";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type DocsSidebarProps = {
  navigation: typeof docsNavigation;
  isOpen: boolean;
  onClose: () => void;
};

export function DocsSidebar({ navigation, isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navigation.map((s) => s.slug),
  );

  const toggleSection = (slug: string) => {
    setExpandedSections((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const currentSlug = pathname.split("/").pop();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[300px] bg-background border-r border-border",
          "transform transition-transform duration-200 ease-out",
          "overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <Link
            href="/docs"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <Icons.LogoSmall className="w-5 h-5" />
            <span className="font-sans text-sm font-medium">Documentation</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-secondary transition-colors"
            aria-label="Close sidebar"
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6">
          {/* Back link */}
          <Link
            href="/docs"
            className="flex items-center gap-2 px-2 py-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
          >
            <Icons.ArrowBack className="w-4 h-4" />
            <span>Ask Midday</span>
          </Link>

          {/* Sections */}
          <div className="space-y-1">
            {navigation.map((section) => (
              <div key={section.slug}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.slug)}
                  className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
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
                  <div className="mt-1 mb-3 ml-2 pl-3 border-l border-border">
                    {section.docs.map((doc) => (
                      <Link
                        key={doc.slug}
                        href={`/docs/${doc.slug}`}
                        onClick={onClose}
                        className={cn(
                          "block px-2 py-1.5 text-sm transition-colors",
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
        </nav>
      </aside>
    </>
  );
}
