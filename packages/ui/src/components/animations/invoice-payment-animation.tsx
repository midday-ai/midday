"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Invoice {
  id: string;
  customer: string;
  amount: string;
  dueDate: string;
  invoiceDate: string;
  invoiceNo: string;
  status: "sent" | "paid" | "overdue" | "scheduled" | "recurring";
}

const initialInvoices: Omit<Invoice, "status">[] = [
  {
    id: "1",
    customer: "Acme Corp",
    amount: "$2,450.50",
    dueDate: "Mar 19",
    invoiceDate: "Mar 19",
    invoiceNo: "INV-015",
  },
  {
    id: "2",
    customer: "TechFlow Inc",
    amount: "$1,850.00",
    dueDate: "Mar 18",
    invoiceDate: "Mar 18",
    invoiceNo: "INV-014",
  },
  {
    id: "3",
    customer: "Design Studio",
    amount: "$3,200.75",
    dueDate: "Mar 16",
    invoiceDate: "Mar 16",
    invoiceNo: "INV-013",
  },
  {
    id: "4",
    customer: "Cloud Services",
    amount: "$1,120.25",
    dueDate: "Mar 15",
    invoiceDate: "Mar 15",
    invoiceNo: "INV-012",
  },
  {
    id: "5",
    customer: "Data Systems",
    amount: "$4,500.00",
    dueDate: "Mar 14",
    invoiceDate: "Mar 14",
    invoiceNo: "INV-011",
  },
  {
    id: "6",
    customer: "Media Works",
    amount: "$2,100.25",
    dueDate: "Mar 13",
    invoiceDate: "Mar 13",
    invoiceNo: "INV-010",
  },
  {
    id: "7",
    customer: "Creative Labs",
    amount: "$1,750.50",
    dueDate: "Mar 12",
    invoiceDate: "Mar 12",
    invoiceNo: "INV-009",
  },
  {
    id: "8",
    customer: "Digital Solutions",
    amount: "$3,800.00",
    dueDate: "Mar 11",
    invoiceDate: "Mar 11",
    invoiceNo: "INV-008",
  },
  {
    id: "9",
    customer: "Innovation Hub",
    amount: "$2,650.00",
    dueDate: "Mar 10",
    invoiceDate: "Mar 10",
    invoiceNo: "INV-007",
  },
  {
    id: "10",
    customer: "Tech Ventures",
    amount: "$1,950.75",
    dueDate: "Mar 09",
    invoiceDate: "Mar 09",
    invoiceNo: "INV-006",
  },
  {
    id: "11",
    customer: "Studio Alpha",
    amount: "$3,400.50",
    dueDate: "Mar 08",
    invoiceDate: "Mar 08",
    invoiceNo: "INV-005",
  },
  {
    id: "12",
    customer: "Global Networks",
    amount: "$2,800.25",
    dueDate: "Mar 07",
    invoiceDate: "Mar 07",
    invoiceNo: "INV-004",
  },
  {
    id: "13",
    customer: "Future Systems",
    amount: "$1,600.00",
    dueDate: "Mar 06",
    invoiceDate: "Mar 06",
    invoiceNo: "INV-003",
  },
  {
    id: "14",
    customer: "Pixel Perfect",
    amount: "$2,300.50",
    dueDate: "Mar 05",
    invoiceDate: "Mar 05",
    invoiceNo: "INV-002",
  },
  {
    id: "15",
    customer: "Code Masters",
    amount: "$4,200.75",
    dueDate: "Mar 04",
    invoiceDate: "Mar 04",
    invoiceNo: "INV-001",
  },
];

export function InvoicePaymentAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCards, setShowCards] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>(
    initialInvoices.map((inv) => ({ ...inv, status: "sent" as const })),
  );
  const [showPaymentScore, setShowPaymentScore] = useState(false);
  const [visibleBars, setVisibleBars] = useState<number[]>([]);

  const [openAmount] = useState("$36,500.75");
  const [overdueAmount, _setOverdueAmount] = useState("$12,500.50");
  const [paidAmount, setPaidAmount] = useState("$126,500.75");
  const [openCount] = useState(6);
  const [overdueCount, setOverdueCount] = useState(12);
  const [paidCount, setPaidCount] = useState(10);

  const paymentScoreBars = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    filled: i < 8,
  }));

  useEffect(() => {
    if (!shouldPlay) return;

    const cardsTimer = setTimeout(() => setShowCards(true), 0);

    const scoreTimer = setTimeout(() => {
      setShowPaymentScore(true);
      paymentScoreBars.forEach((_, index) => {
        setTimeout(
          () => {
            setVisibleBars((prev) => [...prev, index]);
          },
          900 + index * 50,
        );
      });
    }, 700);

    const tableTimer = setTimeout(() => setShowTable(true), 500);

    const flipTimers: NodeJS.Timeout[] = [];
    const invoiceCount = initialInvoices.length;
    const overdueIndices = [2, 7];
    const scheduledIndices = [1];
    const recurringIndices = [4];
    let paidCount = 0;
    let paidTotal = 0;

    initialInvoices.forEach((invoice, index) => {
      const timer = setTimeout(
        () => {
          const isOverdue = overdueIndices.includes(index);
          const isScheduled = scheduledIndices.includes(index);
          const isRecurring = recurringIndices.includes(index);
          let newStatus: "paid" | "overdue" | "scheduled" | "recurring";

          if (isOverdue) {
            newStatus = "overdue";
          } else if (isScheduled) {
            newStatus = "scheduled";
          } else if (isRecurring) {
            newStatus = "recurring";
          } else {
            newStatus = "paid";
          }

          setInvoices((prev) =>
            prev.map((inv, idx) =>
              idx === index ? { ...inv, status: newStatus } : inv,
            ),
          );

          if (isOverdue) {
            setOverdueCount((prev) => prev + 1);
          } else if (!isScheduled && !isRecurring) {
            paidCount++;
            paidTotal += Number.parseFloat(
              invoice.amount.replace(/[^0-9.]/g, ""),
            );
          }

          if (index === invoiceCount - 1) {
            setPaidCount((prev) => prev + paidCount);
            setPaidAmount((prev) => {
              const current = Number.parseFloat(prev.replace(/[^0-9.]/g, ""));
              return `$${(current + paidTotal).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            });
          }
        },
        2000 + index * 400,
      );
      flipTimers.push(timer);
    });

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 15000)
      : undefined;

    return () => {
      clearTimeout(cardsTimer);
      clearTimeout(scoreTimer);
      clearTimeout(tableTimer);
      flipTimers.forEach(clearTimeout);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative overflow-hidden"
    >
      {/* Header */}
      <div className="px-2 md:px-3 pt-3 md:pt-4 pb-2 md:pb-3 border-b border-border relative z-10">
        <h3 className="text-[13px] md:text-[14px] text-foreground">Invoices</h3>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden flex flex-col z-10">
        {/* Status Cards */}
        {showCards && (
          <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6 pb-4 md:pb-6">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                {openAmount}
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Open
              </div>
              <div className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                {openCount} invoices
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                {overdueAmount}
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Overdue
              </div>
              <div className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                {overdueCount} invoices
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                {paidAmount}
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Paid
              </div>
              <div className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                {paidCount} invoices
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <div className="font-serif text-base md:text-lg text-foreground">
                  Good
                </div>
                {showPaymentScore && (
                  <div className="flex gap-1 md:gap-1 items-end">
                    {paymentScoreBars.map((bar, index) => (
                      <motion.div
                        key={bar.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: visibleBars.includes(index) ? "18px" : 0,
                          opacity: visibleBars.includes(index) ? 1 : 0,
                        }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        className={`w-[2px] md:w-[3px] ${
                          bar.filled ? "bg-foreground" : "bg-muted-foreground"
                        }`}
                        style={{ minHeight: "18px" }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1.5 md:mb-2">
                Payment score
              </div>
              <div className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                Right on schedule
              </div>
            </motion.div>
          </div>
        )}

        {/* Table */}
        {showTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="flex-1 min-h-0 overflow-hidden border border-border bg-background"
          >
            <table
              className="w-full border-collapse"
              style={{ borderSpacing: 0 }}
            >
              <thead className="sticky top-0 z-10 bg-secondary border-b border-border">
                <tr className="h-[28px] md:h-[32px]">
                  <th className="w-[75px] md:w-[70px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Due date
                  </th>
                  <th className="w-[140px] md:w-[170px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Customer
                  </th>
                  <th className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Amount
                  </th>
                  <th className="hidden md:table-cell lg:hidden w-[90px] md:w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Invoice no.
                  </th>
                  <th className="w-[115px] md:w-[110px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: showTable ? 1 : 0,
                      y: showTable ? 0 : 10,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: 0.5 + index * 0.08,
                      ease: "easeOut",
                    }}
                    className="h-[28px] md:h-[32px] border-b border-border bg-background hover:bg-secondary transition-colors"
                  >
                    <td className="w-[75px] md:w-[70px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-muted-foreground border-r border-border">
                      {invoice.dueDate}
                    </td>
                    <td className="w-[140px] md:w-[170px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      <div className="truncate" title={invoice.customer}>
                        {invoice.customer}
                      </div>
                    </td>
                    <td className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      {invoice.amount}
                    </td>
                    <td className="hidden md:table-cell lg:hidden w-[90px] md:w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      {invoice.invoiceNo}
                    </td>
                    <td className="w-[115px] md:w-[110px] px-1.5 md:px-2">
                      <div className="flex items-center h-full">
                        <AnimatePresence mode="wait">
                          {invoice.status === "sent" ? (
                            <motion.div
                              key="sent"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center px-1.5 py-px rounded-full bg-secondary border border-border"
                            >
                              <span className="font-sans text-[9px] md:text-[10px] text-foreground">
                                Sent
                              </span>
                            </motion.div>
                          ) : invoice.status === "overdue" ? (
                            <motion.div
                              key="overdue"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center px-1.5 py-px rounded-full bg-yellow-500/10 border border-yellow-500/20"
                            >
                              <span className="font-sans text-[9px] md:text-[10px] text-yellow-500">
                                Overdue
                              </span>
                            </motion.div>
                          ) : invoice.status === "scheduled" ? (
                            <motion.div
                              key="scheduled"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center px-1.5 py-px rounded-full bg-blue-500/10 border border-blue-500/20"
                            >
                              <span className="font-sans text-[9px] md:text-[10px] text-blue-500">
                                Scheduled
                              </span>
                            </motion.div>
                          ) : invoice.status === "recurring" ? (
                            <motion.div
                              key="recurring"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center px-1.5 py-px rounded-full bg-orange-500/10 border border-orange-500/20"
                            >
                              <span className="font-sans text-[9px] md:text-[10px] text-orange-500">
                                Recurring
                              </span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="paid"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="inline-flex items-center px-1.5 py-px rounded-full bg-green-500/10 border border-green-500/20"
                            >
                              <span className="font-sans text-[9px] md:text-[10px] text-green-500">
                                Paid
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
