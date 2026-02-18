"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdOutlineFilterList,
  MdOutlineLink,
  MdOutlinePictureAsPdf,
  MdOutlineReceipt,
  MdOutlineReceiptLong,
  MdSearch,
} from "react-icons/md";

const dynamicIconMap: Record<string, IconType> = {
  pdf: MdOutlinePictureAsPdf,
  receipt: MdOutlineReceipt,
  receipt_long: MdOutlineReceiptLong,
};

function DynamicIcon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = dynamicIconMap[name];
  return Icon ? <Icon className={className} size={size} /> : null;
}

export function InboxMatchAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIncoming, setShowIncoming] = useState(false);
  const [showSuggestBar, setShowSuggestBar] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const items = [
    {
      id: 1,
      title: "Google-invoice.pdf",
      amount: "$12.00",
      date: "Sep 08",
      icon: "pdf",
    },
    {
      id: 2,
      title: "AWS-receipt.pdf",
      amount: "$54.30",
      date: "Sep 07",
      icon: "receipt",
    },
    {
      id: 3,
      title: "Figma-receipt.pdf",
      amount: "$24.00",
      date: "Sep 06",
      icon: "receipt_long",
    },
    {
      id: 4,
      title: "GitHub-receipt.pdf",
      amount: "$9.00",
      date: "Sep 05",
      icon: "pdf",
    },
    {
      id: 5,
      title: "Notion-receipt.pdf",
      amount: "$16.00",
      date: "Sep 04",
      icon: "receipt",
    },
    {
      id: 6,
      title: "Slack-receipt.pdf",
      amount: "$8.50",
      date: "Sep 03",
      icon: "receipt_long",
    },
  ];
  const incomingItem = {
    id: 999,
    title: "Stripe-receipt.pdf",
    amount: "$89.00",
    date: "Sep 10",
  };

  useEffect(() => {
    if (!shouldPlay) return;

    const itemsTimer = setTimeout(() => setShowItems(true), 0);
    const incomingTimer = setTimeout(() => setShowIncoming(true), 1100);
    const barTimer = setTimeout(() => setShowSuggestBar(true), 1500);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 12000)
      : undefined;

    return () => {
      clearTimeout(itemsTimer);
      clearTimeout(incomingTimer);
      clearTimeout(barTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <h3 className="text-[13px] md:text-[14px] text-foreground">Inbox</h3>
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
        <div className="relative">
          <input
            type="text"
            placeholder="Search inbox..."
            className="w-full bg-background border border-border px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border/50 rounded-none pr-7 md:pr-8"
          />
          <MdSearch
            className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground"
            size={14}
          />
        </div>
      </div>

      <div className="flex-1 px-2 md:px-3 pb-2 md:pb-3 overflow-visible relative">
        <div className="h-full pt-0 pb-24 md:pb-32 flex flex-col justify-end gap-1.5 md:gap-2">
          {items.slice(1).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: showItems ? 1 : 0 }}
              transition={{
                duration: 0.25,
                delay: showItems ? idx * 0.1 : 0,
              }}
              className="bg-background border border-border p-2 md:p-3 transform-gpu will-change-transform"
            >
              <div className="flex items-start gap-1.5 md:gap-2">
                <span className="inline-flex w-5 h-5 md:w-6 md:h-6 items-center justify-center bg-secondary border border-border flex-shrink-0">
                  <DynamicIcon
                    name={item.icon}
                    className="text-sm text-muted-foreground"
                    size={14}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 md:gap-2">
                    <p className="text-[11px] md:text-[12px] text-foreground truncate">
                      {item.title}
                    </p>
                    <span className="text-[11px] md:text-[12px] text-muted-foreground whitespace-nowrap">
                      {item.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 md:mt-1">
                    <span className="text-[9px] md:text-[10px] text-muted-foreground">
                      Inbox
                    </span>
                    <span className="text-[9px] md:text-[10px] text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {showIncoming && (
            <motion.div
              key={incomingItem.id}
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 24,
                mass: 0.6,
              }}
              className="bg-secondary border border-border p-2 md:p-3 transform-gpu will-change-transform absolute bottom-[48px] md:bottom-[68px] left-2 md:left-3 right-2 md:right-3 z-50"
            >
              <div className="flex items-start gap-1.5 md:gap-2">
                <span className="inline-flex w-5 h-5 md:w-6 md:h-6 items-center justify-center bg-secondary border border-border flex-shrink-0">
                  <Image
                    src="/images/gmail.svg"
                    alt="Gmail"
                    width={16}
                    height={16}
                    className="w-3 h-3 md:w-3.5 md:h-3.5 object-contain"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 md:gap-2">
                    <p className="text-[11px] md:text-[12px] text-foreground truncate">
                      {incomingItem.title}
                    </p>
                    <span className="text-[11px] md:text-[12px] text-muted-foreground whitespace-nowrap">
                      {incomingItem.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 md:mt-1">
                    <span className="text-[9px] md:text-[10px] text-muted-foreground truncate">
                      From: receipts@stripe.com
                    </span>
                    <span className="text-[9px] md:text-[10px] text-muted-foreground ml-1">
                      {incomingItem.date}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: showSuggestBar ? 1 : 0,
          y: showSuggestBar ? 0 : 10,
        }}
        transition={{ duration: 0.25 }}
        className="px-2 md:px-3 pt-2 md:pt-3 pb-2 md:pb-3 relative z-40"
      >
        <div className="w-full bg-secondary border border-border px-2 md:px-3 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <MdOutlineLink
              className="text-sm text-muted-foreground flex-shrink-0"
              size={14}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] md:text-[12px] text-foreground truncate">
                Suggested match
              </div>
              <div className="text-[10px] md:text-[12px] text-muted-foreground truncate">
                Transaction • Stripe • $89.00 • Sep 10
              </div>
            </div>
          </div>
          <button
            type="button"
            className="ml-2 md:ml-3 flex items-center justify-center h-7 md:h-8 px-2 md:px-3 bg-transparent border border-border text-[11px] md:text-[12px] text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            Review
          </button>
        </div>
      </motion.div>
    </div>
  );
}
