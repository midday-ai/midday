"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdOutlineFilterList, MdSearch } from "react-icons/md";

export function FileGridAnimation({
  onComplete,
  shouldPlay = true,
  isLightMode = false,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
  isLightMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [firstCardLoaded, setFirstCardLoaded] = useState(false);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    if (!shouldPlay) return;

    const cardsTimer = setTimeout(() => setShowCards(true), 0);
    const contentTimer = setTimeout(() => setFirstCardLoaded(true), 1200);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 12000)
      : undefined;

    return () => {
      clearTimeout(cardsTimer);
      clearTimeout(contentTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  const files = [
    {
      id: 1,
      title: "Invoice — Acme Co",
      desc: "Mar 2025 • $3,000",
      description:
        "Final invoice for Q1 development work including 20 hours of backend development and 15 hours of frontend integration.",
      tags: ["invoice", "acme", "paid"],
      icon: "description",
    },
    {
      id: 2,
      title: "Receipt — Figma",
      desc: "Mar 12 • $24.00",
      description:
        "Monthly subscription renewal for design collaboration tools used across all client projects.",
      tags: ["receipt", "design", "subscription"],
      icon: "receipt_long",
    },
    {
      id: 3,
      title: "Proposal — Redstone",
      desc: "Q2 • Draft",
      description:
        "Project proposal for mobile app development including timeline, deliverables, and pricing breakdown.",
      tags: ["proposal", "client"],
      icon: "draft",
    },
    {
      id: 4,
      title: "Timesheet — Sprint 14",
      desc: "42h • Dev/Design",
      description:
        "Weekly timesheet tracking development and design work across multiple client projects.",
      tags: ["timesheet", "hours"],
      icon: "schedule",
    },
    {
      id: 5,
      title: "Contract — NDA",
      desc: "Signed • 2025",
      description:
        "Non-disclosure agreement for confidential client project discussions and proprietary information.",
      tags: ["contract", "legal"],
      icon: "gavel",
    },
    {
      id: 6,
      title: "Report — Q1 Expenses",
      desc: "Auto-generated",
      description:
        "Automated expense report summarizing all business costs, categorized by type and project.",
      tags: ["report", "expenses"],
      icon: "analytics",
    },
  ];

  const filtered = files.filter((f) => {
    const q = query.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.desc.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      <div>
        <div className="flex items-center justify-between mb-2 md:mb-3 px-2 md:px-3 pt-2 md:pt-3">
          <h3 className="text-[13px] md:text-[14px] text-foreground">Files</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <MdOutlineFilterList
                className="text-sm text-muted-foreground"
                size={16}
              />
            </button>
          </div>
        </div>
        <div className="px-2 md:px-3 pb-1.5 md:pb-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-background border border-border px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/50 rounded-none pr-7 md:pr-8"
            />
            <MdSearch
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={14}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 md:px-3 pb-2 md:pb-3 overflow-hidden mt-2 md:mt-3">
        <div className="grid grid-cols-2 gap-2 md:gap-3 h-full">
          {filtered.slice(0, 6).map((f, idx) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: showCards ? 1 : 0, y: showCards ? 0 : 12 }}
              transition={{ duration: 0.25, delay: showCards ? idx * 0.08 : 0 }}
              className="bg-secondary border border-border p-1.5 md:p-2 lg:p-3 flex flex-col gap-1.5 md:gap-2 h-full min-h-[120px] md:min-h-[140px]"
            >
              {idx === 0 && !firstCardLoaded ? (
                <>
                  <div className="flex flex-col">
                    <div className="animate-pulse h-2 md:h-2.5 lg:h-3 bg-muted w-3/4 rounded-none" />
                    <div className="animate-pulse h-2 md:h-2.5 lg:h-3 bg-muted mt-1.5 md:mt-2 w-1/2 rounded-none" />
                    <div className="animate-pulse h-1.5 md:h-2 bg-muted mt-2 md:mt-2.5 lg:mt-3 w-[95%] rounded-none" />
                    <div className="animate-pulse h-1.5 md:h-2 bg-muted mt-1 w-4/5 rounded-none" />
                    <div className="animate-pulse h-1.5 md:h-2 bg-muted mt-1 w-3/5 rounded-none" />
                  </div>
                  <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 flex-wrap mt-auto">
                    <div className="h-3 md:h-3.5 lg:h-4 w-12 md:w-14 lg:w-16 bg-muted rounded-full animate-pulse" />
                    <div className="h-3 md:h-3.5 lg:h-4 w-10 md:w-12 lg:w-14 bg-muted rounded-full animate-pulse" />
                    <div className="h-3 md:h-3.5 lg:h-4 w-8 md:w-10 lg:w-12 bg-muted rounded-full animate-pulse" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col">
                    <div className="text-[10px] md:text-[11px] text-foreground mb-0.5 md:mb-1">
                      {f.title}
                    </div>
                    <div className="text-[8px] md:text-[9px] text-muted-foreground mb-1.5 md:mb-2">
                      {f.desc}
                    </div>
                    <div className="text-[8px] md:text-[9px] text-muted-foreground leading-relaxed">
                      {f.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mt-auto">
                    {f.tags.slice(0, 2).map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center h-3.5 md:h-4 px-1 md:px-1.5 bg-muted rounded-full border border-border dark:border-0"
                      >
                        <span className="text-[8px] md:text-[9px] leading-none text-muted-foreground">
                          {tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
