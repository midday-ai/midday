"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { motion } from "framer-motion";
import { ConnectIMessage } from "@/components/inbox/connect-imessage";
import { ConnectSlack } from "@/components/inbox/connect-slack";
import { ConnectTelegram } from "@/components/inbox/connect-telegram";
import { ConnectWhatsApp } from "@/components/inbox/connect-whatsapp";

export function ConnectChatStep() {
  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg lg:text-xl font-serif"
      >
        Run your business from chat
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted-foreground leading-relaxed"
      >
        Send invoices, match receipts, and check your numbers — right from
        iMessage, WhatsApp, or any messaging app.
      </motion.p>

      <motion.ul
        className="space-y-2 pl-0 list-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        {[
          "Get notified and send payment reminders instantly",
          "Create invoices with a simple text message",
          "Snap a receipt and match it to a transaction",
          "Ask about your latest transactions anytime",
        ].map((feature, index) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 border border-border bg-secondary">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="relative z-10"
              >
                <path
                  d="M2 5L4.5 7.5L8 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground leading-relaxed">
              {feature}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="border-t border-border !mt-6"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="!mt-6"
      >
        <div className="flex gap-2">
          <ConnectIMessage />
          <ConnectWhatsApp />
        </div>

        <Accordion type="single" collapsible className="border-t pt-2 mt-4">
          <AccordionItem value="more-options" className="border-0">
            <AccordionTrigger className="justify-center space-x-2 flex text-sm">
              <span>More options</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4">
              <div className="flex flex-col space-y-4">
                <ConnectSlack />
                <ConnectTelegram />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>

      <p className="text-[11px] text-muted-foreground text-center pt-4">
        Connect any platform in seconds · You can add more anytime
      </p>
    </div>
  );
}
