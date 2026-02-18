"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdSearch } from "react-icons/md";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "none" | "in_review";
  checked: boolean;
}

const initialTransactions: Omit<Transaction, "status" | "checked">[] = [
  {
    id: "1",
    date: "Mar 19",
    description: "Office Supplies Co",
    amount: "-$245.50",
  },
  {
    id: "2",
    date: "Mar 18",
    description: "Cloud Services Inc",
    amount: "-$1,200.00",
  },
  {
    id: "3",
    date: "Mar 17",
    description: "Marketing Agency",
    amount: "-$3,500.00",
  },
  {
    id: "4",
    date: "Mar 16",
    description: "Software License",
    amount: "-$850.75",
  },
  {
    id: "5",
    date: "Mar 15",
    description: "Consulting Services",
    amount: "-$2,100.25",
  },
  {
    id: "6",
    date: "Mar 14",
    description: "Equipment Rental",
    amount: "-$1,750.00",
  },
  {
    id: "7",
    date: "Mar 13",
    description: "Travel Expenses",
    amount: "-$980.50",
  },
  {
    id: "8",
    date: "Mar 12",
    description: "Utilities Payment",
    amount: "-$450.00",
  },
  {
    id: "9",
    date: "Mar 11",
    description: "Office Rent",
    amount: "-$4,200.00",
  },
  {
    id: "10",
    date: "Mar 10",
    description: "Internet Service",
    amount: "-$89.99",
  },
  {
    id: "11",
    date: "Mar 09",
    description: "Phone Service",
    amount: "-$125.00",
  },
  {
    id: "12",
    date: "Mar 08",
    description: "Insurance Premium",
    amount: "-$650.00",
  },
  {
    id: "13",
    date: "Mar 07",
    description: "Legal Services",
    amount: "-$1,500.00",
  },
  {
    id: "14",
    date: "Mar 06",
    description: "Accounting Services",
    amount: "-$800.00",
  },
  {
    id: "15",
    date: "Mar 05",
    description: "Marketing Tools",
    amount: "-$320.50",
  },
  {
    id: "16",
    date: "Mar 04",
    description: "Web Hosting",
    amount: "-$199.99",
  },
  {
    id: "17",
    date: "Mar 03",
    description: "Design Services",
    amount: "-$2,800.00",
  },
  {
    id: "18",
    date: "Mar 02",
    description: "Office Furniture",
    amount: "-$1,450.00",
  },
  {
    id: "19",
    date: "Mar 01",
    description: "Software Subscription",
    amount: "-$299.00",
  },
  {
    id: "20",
    date: "Feb 28",
    description: "Shipping Costs",
    amount: "-$125.50",
  },
  {
    id: "21",
    date: "Feb 27",
    description: "Conference Tickets",
    amount: "-$850.00",
  },
  {
    id: "22",
    date: "Feb 26",
    description: "Printing Services",
    amount: "-$320.00",
  },
];

export function BulkReconciliationAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions.map((t) => ({
      ...t,
      status: "none" as const,
      checked: false,
    })),
  );
  const [showTable, setShowTable] = useState(false);
  const [showDragdrop, setShowDragdrop] = useState(false);
  const [dragdropPosition, setDragdropPosition] = useState({ x: 0, y: -100 });
  const [isDropping, setIsDropping] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showActionBar, setShowActionBar] = useState(false);

  const selectedCount = transactions.filter((t) => t.checked).length;
  const inReviewCount = transactions.filter(
    (t) => t.status === "in_review",
  ).length;

  useEffect(() => {
    if (!shouldPlay) return;

    setShowTable(true);

    const dragdropTimer = setTimeout(() => {
      setShowDragdrop(true);
      setTimeout(() => {
        setDragdropPosition({ x: 0, y: 100 });
      }, 100);
      setTimeout(() => {
        setIsDropping(true);
        setDragdropPosition({ x: 0, y: 150 });
      }, 800);
      setTimeout(() => {
        setShowDragdrop(false);
      }, 1200);
    }, 1000);

    const reconcileTimers: NodeJS.Timeout[] = [];
    const checkedIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    const allInReviewDoneTime = 2200 + 200;

    const reviewTimer = setTimeout(() => {
      setTransactions((prev) =>
        prev.map((t, idx) =>
          idx < 12 ? { ...t, status: "in_review" as const } : t,
        ),
      );
    }, 2200 + 200);
    reconcileTimers.push(reviewTimer);

    const shuffledIndices = [...checkedIndices].sort(() => Math.random() - 0.5);
    shuffledIndices.forEach((index, checkOrder) => {
      const randomDelay = Math.random() * 300;
      const checkTimer = setTimeout(
        () => {
          setTransactions((prev) => {
            return prev.map((t, idx) =>
              idx === index
                ? { ...t, status: "in_review" as const, checked: true }
                : t,
            );
          });
        },
        allInReviewDoneTime + 200 + randomDelay + checkOrder * 50,
      );
      reconcileTimers.push(checkTimer);
    });

    const maxCheckTime = allInReviewDoneTime + 200 + 300 + 11 * 50;
    const actionBarTimer = setTimeout(() => {
      setShowActionBar(true);
    }, maxCheckTime + 100);
    reconcileTimers.push(actionBarTimer);

    let _done: NodeJS.Timeout | undefined;
    if (onComplete) {
      _done = setTimeout(() => {
        onComplete();
      }, 10000);
    }

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;

    return () => {
      clearTimeout(dragdropTimer);
      for (const timer of reconcileTimers) {
        clearTimeout(timer);
      }
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative overflow-hidden border-b border-border"
    >
      {/* Header */}
      <div className="px-2 md:px-3 pt-1 md:pt-1.5 pb-1.5 md:pb-2 relative z-10">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-[13px] md:text-[14px] text-foreground">
            Transactions
          </h3>
        </div>
      </div>

      {/* Search and Tabs Row */}
      <div className="flex items-center justify-between gap-2 w-full mb-0.5 relative z-10">
        <div className="relative flex-1 max-w-[200px] md:max-w-[240px]">
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full bg-background border border-border px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/50 rounded-none pr-6 md:pr-7"
          />
          <div className="absolute right-1.5 md:right-2 top-0 bottom-0 flex items-center pointer-events-none">
            <MdSearch className="text-muted-foreground" size={12} />
          </div>
        </div>

        <div className="relative flex items-stretch bg-muted flex-shrink-0">
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`group relative flex items-center gap-1.5 px-2 py-1 h-7 text-[10px] md:text-[11px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                activeTab === "all"
                  ? "text-foreground bg-background border-border"
                  : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
              }`}
              style={{
                WebkitTapHighlightColor: "transparent",
                marginBottom: activeTab === "all" ? "-1px" : "0px",
                position: "relative",
                zIndex: activeTab === "all" ? 10 : 1,
              }}
            >
              <span>All</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("in_review")}
              className={`group relative flex items-center gap-1.5 px-2 py-1 h-7 text-[10px] md:text-[11px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                activeTab === "in_review"
                  ? "text-foreground bg-background border-border"
                  : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
              }`}
              style={{
                WebkitTapHighlightColor: "transparent",
                marginBottom: activeTab === "in_review" ? "-1px" : "0px",
                position: "relative",
                zIndex: activeTab === "in_review" ? 10 : 1,
              }}
            >
              <span>In review ({inReviewCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dragdrop Image */}
      {showDragdrop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: isDropping ? 0.9 : 1,
            x: dragdropPosition.x,
            y: dragdropPosition.y,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: isDropping ? 0.3 : 0.6,
            ease: isDropping ? "easeIn" : "easeOut",
          }}
          className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ top: "20%" }}
        >
          <Image
            src="/images/dragdrop.svg"
            alt="Drag and drop"
            width={120}
            height={80}
            className="w-[100px] md:w-[120px] h-auto object-contain"
          />
        </motion.div>
      )}

      {/* Table */}
      {showTable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 min-h-0 overflow-visible border border-b border-border bg-background relative z-0 mt-2 md:mt-3 flex flex-col"
        >
          <div className="overflow-visible pb-12">
            <table
              className="w-full border-collapse"
              style={{ borderSpacing: 0 }}
            >
              <thead className="sticky top-0 z-10 bg-secondary border-b border-border">
                <tr className="h-[28px] md:h-[32px]">
                  <th className="w-[32px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    <div className="flex items-center justify-center" />
                  </th>
                  <th className="w-[60px] md:w-[70px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Date
                  </th>
                  <th className="w-[140px] md:w-[180px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Description
                  </th>
                  <th className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Amount
                  </th>
                  <th className="w-[110px] md:w-[120px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, _index) => (
                  <tr
                    key={transaction.id}
                    className="h-[28px] md:h-[32px] border-b border-border bg-background hover:bg-secondary transition-colors"
                  >
                    <td className="w-[32px] px-1.5 md:px-2 border-r border-border">
                      <div className="flex items-center justify-center h-full">
                        <AnimatePresence mode="wait">
                          {transaction.checked ? (
                            <motion.div
                              key="checked"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.2 }}
                              className="w-3 h-3 bg-primary flex items-center justify-center"
                            >
                              <MdCheck
                                className="text-primary-foreground"
                                size={10}
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="unchecked"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-3 h-3 border border-border bg-background"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    <td className="w-[60px] md:w-[70px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-muted-foreground border-r border-border">
                      {transaction.date}
                    </td>
                    <td className="w-[140px] md:w-[180px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>
                    <td className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      {transaction.amount}
                    </td>
                    <td className="w-[110px] md:w-[120px] px-1.5 md:px-2">
                      <div className="flex items-center h-full">
                        {transaction.status === "in_review" && (
                          <span className="font-sans text-[10px] md:text-[11px] text-muted-foreground">
                            In review
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Bar */}
          {showActionBar && selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-[7px] border border-border p-1.5 md:p-2 flex items-center justify-between z-30 shadow-lg pointer-events-auto"
              style={{ transform: "scale(0.9)" }}
            >
              <span className="font-sans text-[10px] md:text-[11px] text-muted-foreground pl-2 md:pl-3">
                {selectedCount} selected
              </span>
              <button
                type="button"
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <span className="font-sans text-[10px] md:text-[11px]">
                  Export
                </span>
                <Image
                  src="/images/xero.svg"
                  alt="Xero"
                  width={12}
                  height={12}
                  className="w-[10px] h-[10px] md:w-[12px] md:h-[12px] object-contain"
                />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
