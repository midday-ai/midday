"use client";

import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  MdOutlineArrowDownward,
  MdOutlineArrowOutward,
  MdOutlineArrowUpward,
  MdOutlineDescription,
  MdOutlineListAlt,
  MdOutlinePictureAsPdf,
  MdOutlineReceipt,
  MdOutlineSubdirectoryArrowLeft,
  MdSearch,
} from "react-icons/md";

export function CommandPanelAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [_searchQuery, _setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const transactionSearch = "Acme";
  const [displayedQuery, setDisplayedQuery] = useState("");

  const transaction = {
    id: 1,
    name: "Acme Corporation",
    amount: "$3,500.00",
    date: "Jan 15, 2025",
  };

  const invoices = [
    {
      id: 1,
      name: "Invoice #INV-2025-001",
      amount: "$3,500.00",
      date: "Jan 15, 2025",
    },
    {
      id: 2,
      name: "Invoice #INV-2024-089",
      amount: "$2,200.00",
      date: "Dec 20, 2024",
    },
  ];

  const receipts = [
    {
      id: 1,
      name: "Receipt - Acme Services",
      amount: "$450.00",
      date: "Jan 10, 2025",
    },
    {
      id: 2,
      name: "Receipt - Acme Subscription",
      amount: "$299.00",
      date: "Jan 5, 2025",
    },
  ];

  const files = [
    {
      id: 1,
      name: "Acme_Contract_Q1_2025.pdf",
    },
    {
      id: 2,
      name: "Invoice_Acme_2025-001.pdf",
    },
    {
      id: 3,
      name: "Receipt_Office_Supplies_Jan_2025.pdf",
    },
    {
      id: 4,
      name: "Acme_Payment_Confirmation.pdf",
    },
  ];

  useEffect(() => {
    if (!shouldPlay) return;

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < transactionSearch.length) {
        setDisplayedQuery(transactionSearch.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setShowResults(true);
          setTimeout(() => {
            setShowTransaction(true);
            setTimeout(() => {
              setShowInvoice(true);
              setTimeout(() => {
                setShowReceipts(true);
                setTimeout(() => {
                  setShowFiles(true);
                }, 100);
              }, 100);
            }, 100);
          }, 200);
        }, 400);
      }
    }, 80);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 12000)
      : undefined;

    return () => {
      clearInterval(typingInterval);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete, transactionSearch]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-2 md:p-3"
    >
      {/* Command Panel Container */}
      <div className="w-full max-w-[400px] h-full max-h-[500px] border border-border bg-background flex flex-col relative">
        {/* Search Bar */}
        <div className="pt-1 md:pt-2 pb-1.5 md:pb-2 border-b border-border flex items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={displayedQuery}
              readOnly
              placeholder="Type a command or search..."
              className="w-full bg-background px-2 md:px-3 py-1 md:py-1.5 text-[11px] md:text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none rounded-none pr-7 md:pr-8"
            />
            <MdSearch
              className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={14}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden px-2 md:px-3 py-2 md:py-3">
          {showResults && (
            <>
              {/* Transaction Section */}
              {showTransaction && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-3 md:mb-4"
                >
                  <div className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2 px-1">
                    Transaction
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
                    className="flex items-center gap-2 md:gap-3 pr-2 md:pr-3 py-1 md:py-1.5 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <MdOutlineListAlt
                      className="text-muted-foreground flex-shrink-0"
                      size={16}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] md:text-[12px] text-foreground">
                        {transaction.name}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Invoice Section */}
              {showInvoice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-3 md:mb-4"
                >
                  <div className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2 px-1">
                    Invoice
                  </div>
                  <div className="space-y-0.5">
                    {invoices.map((invoice, index) => (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.08,
                          ease: "easeOut",
                        }}
                        className="flex items-center gap-2 md:gap-3 pr-2 md:pr-3 py-1 md:py-1.5 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <MdOutlineDescription
                          className="text-muted-foreground flex-shrink-0"
                          size={16}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] md:text-[12px] text-foreground">
                            {invoice.name}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Receipts Section */}
              {showReceipts && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-3 md:mb-4"
                >
                  <div className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2 px-1">
                    Receipt
                  </div>
                  <div className="space-y-0.5">
                    {receipts.map((receipt, index) => (
                      <motion.div
                        key={receipt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.08,
                          ease: "easeOut",
                        }}
                        className="flex items-center gap-2 md:gap-3 pr-2 md:pr-3 py-1 md:py-1.5 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <MdOutlineReceipt
                          className="text-muted-foreground flex-shrink-0"
                          size={16}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] md:text-[12px] text-foreground">
                            {receipt.name}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Files Section */}
              {showFiles && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-3 md:mb-4"
                >
                  <div className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2 px-1">
                    Files
                  </div>
                  <div className="space-y-0.5">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.08,
                          ease: "easeOut",
                        }}
                        className="flex items-center gap-2 md:gap-3 pr-2 md:pr-3 py-1 md:py-1.5 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <MdOutlinePictureAsPdf
                          className="text-muted-foreground flex-shrink-0"
                          size={16}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] md:text-[12px] text-foreground truncate">
                            {file.name}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex items-center gap-1 pr-2 md:pr-3 py-1 md:py-1.5 mt-2 text-[11px] md:text-[12px] text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted transition-colors"
                  >
                    <span>View vault</span>
                    <MdOutlineArrowOutward
                      className="text-muted-foreground"
                      size={12}
                    />
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Navigation Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="px-2 md:px-3 py-1.5 md:py-2 border-t border-border flex items-center justify-between"
        >
          <div className="flex items-center">
            <Icons.LogoSmall className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
            >
              <MdOutlineArrowUpward
                className="text-muted-foreground"
                size={12}
              />
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
            >
              <MdOutlineArrowDownward
                className="text-muted-foreground"
                size={12}
              />
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
            >
              <MdOutlineSubdirectoryArrowLeft
                className="text-muted-foreground"
                size={12}
              />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
