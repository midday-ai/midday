"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdOutlineOpenInNew } from "react-icons/md";

export function InvoicePromptAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [visibleSections, setVisibleSections] = useState<number[]>([]);

  const userPrompt =
    "Create an invoice to Acme for 20 development hours and 10 design hours";

  const developmentRate = 100;
  const designRate = 100;
  const developmentQty = 20;
  const designQty = 10;

  const subtotal = developmentQty * developmentRate + designQty * designRate;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  useEffect(() => {
    if (!shouldPlay) return;

    const t1 = setTimeout(() => setShowUserMessage(true), 0);

    const t2 = setTimeout(() => {
      setShowInvoice(true);
      const order = [0, 1, 2, 3, 4];
      order.forEach((sec, idx) => {
        setTimeout(
          () => setVisibleSections((prev) => [...prev, sec]),
          200 + idx * 160,
        );
      });
    }, 1000);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 12000)
      : undefined;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      <div className="flex-1 px-2 md:px-3 py-2 md:py-3 overflow-hidden">
        <div className="space-y-2 md:space-y-3 h-full flex flex-col">
          <div className="flex justify-end">
            <div
              className={`pl-1.5 pr-2 py-1 max-w-[85%] md:max-w-xs rounded-bl-[100px] rounded-tl-[100px] bg-secondary transition-opacity duration-75 ${
                showUserMessage ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-[11px] md:text-[12px] text-right text-foreground">
                {userPrompt}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {showInvoice && (
              <div className="mt-3">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: visibleSections.includes(0) ? 1 : 0,
                    y: visibleSections.includes(0) ? 0 : 6,
                  }}
                  transition={{ duration: 0.25 }}
                  className="mb-4"
                >
                  <h4 className="text-[16px] md:text-[18px] font-normal font-serif text-foreground">
                    Invoice
                  </h4>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: visibleSections.includes(1) ? 1 : 0,
                    y: visibleSections.includes(1) ? 0 : 6,
                  }}
                  transition={{ duration: 0.25 }}
                  className="mb-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-0.5 md:gap-1">
                      <div className="text-[11px] md:text-[12px] text-muted-foreground">
                        From
                      </div>
                      <div className="text-[11px] md:text-[12px] text-foreground">
                        Your Company
                      </div>
                      <div className="text-[11px] md:text-[12px] text-muted-foreground break-all">
                        hello@company.com
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1 text-right">
                      <div className="text-[11px] md:text-[12px] text-muted-foreground">
                        To
                      </div>
                      <div className="text-[11px] md:text-[12px] text-foreground">
                        Acme
                      </div>
                      <div className="text-[11px] md:text-[12px] text-muted-foreground break-all">
                        billing@acme.com
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2 mt-3 md:mt-4">
                    <div className="text-[11px] md:text-[12px] text-muted-foreground">
                      Invoice #
                    </div>
                    <div className="text-[11px] md:text-[12px] text-muted-foreground">
                      Issue date
                    </div>
                    <div className="text-[11px] md:text-[12px] text-muted-foreground text-right">
                      Due in
                    </div>
                    <div className="text-[11px] md:text-[12px] text-foreground">
                      INV-001
                    </div>
                    <div className="text-[11px] md:text-[12px] text-foreground">
                      Sep 29, 2025
                    </div>
                    <div className="text-[11px] md:text-[12px] text-foreground text-right">
                      14 days
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: visibleSections.includes(2) ? 1 : 0,
                    y: visibleSections.includes(2) ? 0 : 6,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-12 py-1.5 md:py-2 border-b border-border">
                    <div className="col-span-5 md:col-span-6 text-[10px] md:text-[12px] text-muted-foreground">
                      Description
                    </div>
                    <div className="col-span-2 text-[10px] md:text-[12px] text-muted-foreground text-right">
                      Qty
                    </div>
                    <div className="col-span-2 text-[10px] md:text-[12px] text-muted-foreground text-right">
                      Rate
                    </div>
                    <div className="col-span-3 md:col-span-2 text-[10px] md:text-[12px] text-muted-foreground text-right">
                      Amount
                    </div>
                  </div>

                  <div className="grid grid-cols-12 py-2 md:py-3">
                    <div className="col-span-5 md:col-span-6 text-[10px] md:text-[12px] text-foreground">
                      Development
                    </div>
                    <div className="col-span-2 text-[10px] md:text-[12px] text-foreground text-right">
                      {developmentQty}
                    </div>
                    <div className="col-span-2 text-[10px] md:text-[12px] text-foreground text-right">
                      ${developmentRate.toFixed(2)}
                    </div>
                    <div className="col-span-3 md:col-span-2 text-[10px] md:text-[12px] text-foreground text-right">
                      ${(developmentQty * developmentRate).toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 py-2 md:py-3 border-b border-border">
                    <div className="col-span-5 md:col-span-6 text-[10px] md:text-[12px] text-foreground">
                      Design
                    </div>
                    <div className="col-span-2 text-[10px] md:text-[12px] text-foreground text-right">
                      {designQty}
                    </div>
                    <div className="col-span-2 text-[10px] md:text-[12px] text-foreground text-right">
                      ${designRate.toFixed(2)}
                    </div>
                    <div className="col-span-3 md:col-span-2 text-[10px] md:text-[12px] text-foreground text-right">
                      ${(designQty * designRate).toFixed(2)}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: visibleSections.includes(3) ? 1 : 0,
                    y: visibleSections.includes(3) ? 0 : 6,
                  }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <div className="grid grid-cols-12 py-1.5 md:py-2">
                    <div className="col-span-7 md:col-span-8" />
                    <div className="col-span-2 text-right text-[10px] md:text-[12px] text-muted-foreground">
                      Subtotal
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right text-[10px] md:text-[12px] text-foreground">
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 md:py-2">
                    <div className="col-span-7 md:col-span-8" />
                    <div className="col-span-2 text-right text-[10px] md:text-[12px] text-muted-foreground">
                      Tax (10%)
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right text-[10px] md:text-[12px] text-foreground">
                      ${tax.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 md:py-2 border-t border-border">
                    <div className="col-span-7 md:col-span-8" />
                    <div className="col-span-2 text-right text-[10px] md:text-[12px] text-muted-foreground">
                      Total
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right text-[10px] md:text-[12px] text-foreground">
                      ${total.toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-2 md:px-3 pb-2 md:pb-3 pt-1">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{
            opacity: visibleSections.includes(4) ? 1 : 0,
            y: visibleSections.includes(4) ? 0 : 6,
          }}
          transition={{ duration: 0.25 }}
          className="border-t border-border pt-2 md:pt-3"
        >
          <div className="py-0.5 md:py-1">
            <div className="text-[11px] md:text-[12px] text-muted-foreground">
              Payment Details
            </div>
            <div className="text-[11px] md:text-[12px] text-foreground break-words">
              Bank: Example Bank, IBAN: XX00 0000 0000 0000 0000
            </div>
            <div className="text-[11px] md:text-[12px] text-foreground">
              Reference: INV-001
            </div>
          </div>
          <div className="mt-1.5 md:mt-2 flex items-end justify-between">
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] md:text-[12px] leading-[15px] md:leading-[16px] text-muted-foreground hover:text-foreground"
            >
              <MdOutlineOpenInNew size={11} />
              <span>Preview invoice</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
