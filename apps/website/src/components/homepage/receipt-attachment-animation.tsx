"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MaterialIcon } from "./icon-mapping";

export function ReceiptAttachmentAnimation() {
  const [showReceipt, setShowReceipt] = useState(false);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    // Show receipt after initial delay
    const receiptTimer = setTimeout(() => {
      setShowReceipt(true);
    }, 500);

    // Show bar after receipt is shown
    const barTimer = setTimeout(() => {
      setShowBar(true);
    }, 2000);

    return () => {
      clearTimeout(receiptTimer);
      clearTimeout(barTimer);
    };
  }, []);

  return (
    <div className="w-full h-full bg-background border border-border overflow-hidden relative">
      {/* Receipt View */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <MaterialIcon
                  name="delete"
                  className="text-muted-foreground"
                  size={14}
                />
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src="/images/gmail.svg"
                  alt="Gmail"
                  width={14}
                  height={14}
                  className="object-contain w-3 h-3 md:w-3.5 md:h-3.5"
                />
                <MaterialIcon
                  name="more_vert"
                  className="text-muted-foreground"
                  size={14}
                />
              </div>
            </div>

            {/* Receipt Content */}
            <div className="flex-1 p-2 md:p-3 overflow-hidden">
              <div className="space-y-2 md:space-y-2.5 h-full flex flex-col">
                {/* Sender Info */}
                <div className="flex items-start gap-2 md:gap-2.5">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] md:text-[11px] font-sans font-medium text-foreground">
                      C
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[11px] md:text-[12px] text-foreground font-medium">
                      CloudSync
                    </p>
                    <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
                      Receipt-2025-0847.pdf
                    </p>
                  </div>
                </div>

                {/* Receipt Preview */}
                <div className="flex-1 bg-card border border-border p-2 md:p-3 overflow-hidden">
                  <div className="space-y-2 md:space-y-2.5 h-full flex flex-col">
                    {/* Receipt Header */}
                    <div className="border-b border-border pb-2 md:pb-2.5">
                      <h3 className="font-sans text-[11px] md:text-[12px] text-foreground font-medium mb-0.5">
                        Receipt
                      </h3>
                      <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                        Receipt #RCP-2025-0847
                      </p>
                    </div>

                    {/* Company Info */}
                    <div className="space-y-0.5">
                      <p className="font-sans text-[11px] md:text-[12px] text-foreground font-medium">
                        CloudSync Technologies Inc.
                      </p>
                      <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                        123 Innovation Drive, Suite 400
                      </p>
                      <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                        San Francisco, CA 94105
                      </p>
                    </div>

                    {/* Receipt Details */}
                    <div className="space-y-1.5 md:space-y-2 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                            Date:
                          </p>
                          <p className="font-sans text-[11px] md:text-[12px] text-foreground">
                            June 15, 2025
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                            Billing Period:
                          </p>
                          <p className="font-sans text-[11px] md:text-[12px] text-foreground">
                            Jun 1 - Jun 30
                          </p>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="border-t border-border pt-1.5 md:pt-2 mt-1.5 md:mt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-[11px] md:text-[12px] text-foreground font-medium">
                                Business Plan - Monthly Subscription
                              </p>
                              <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
                                Cloud storage & sync services
                              </p>
                            </div>
                            <p className="font-sans text-[11px] md:text-[12px] text-foreground font-medium ml-2 flex-shrink-0">
                              $49.00
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="border-t border-border pt-1.5 md:pt-2 mt-auto space-y-1">
                        <div className="flex justify-between">
                          <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                            Subtotal:
                          </p>
                          <p className="font-sans text-[9px] md:text-[10px] text-foreground">
                            $49.00
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                            Tax (Sales Tax 8.5%):
                          </p>
                          <p className="font-sans text-[9px] md:text-[10px] text-foreground">
                            $4.17
                          </p>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 md:pt-1.5 mt-1">
                          <p className="font-sans text-[11px] md:text-[12px] text-foreground font-medium">
                            Total:
                          </p>
                          <p className="font-sans text-[11px] md:text-[12px] text-foreground font-medium">
                            $53.17
                          </p>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="border-t border-border pt-1.5 md:pt-2 mt-1.5 md:mt-2">
                        <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground">
                          Payment Method: Credit Card ending in 4242
                        </p>
                        <p className="font-sans text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
                          Transaction ID: txn_CS2025_8K7M2N
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-[7px] border border-border p-1.5 md:p-2 flex items-center gap-2 z-30 shadow-lg pointer-events-auto"
            style={{ transform: "scale(0.9)" }}
          >
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <span className="font-sans text-[10px] md:text-[11px] text-muted-foreground pl-2 md:pl-3">
                CloudSync • $53.17 • Jun 15, 2025
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden md:flex items-center justify-center h-7 md:h-8 px-2 md:px-3 bg-transparent border border-border text-[11px] md:text-[12px] text-foreground hover:bg-muted transition-colors flex-shrink-0"
              >
                Decline
              </button>
              <button
                type="button"
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors border border-primary"
              >
                <span className="font-sans text-[10px] md:text-[11px]">
                  Confirm
                </span>
                <MaterialIcon
                  name="check"
                  className="text-primary-foreground"
                  size={14}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
