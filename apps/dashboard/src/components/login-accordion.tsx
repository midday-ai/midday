"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@midday/ui/accordion";
import { useState } from "react";

type Props = {
  children: React.ReactNode;
};

export function LoginAccordion({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={isOpen ? "item-1" : ""}
      onValueChange={(value) => setIsOpen(value === "item-1")}
    >
      <AccordionItem value="item-1" className="border-0">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#0e0e0e] dark:bg-[#131313] border border-[#0e0e0e] dark:border-border text-white dark:text-foreground font-sans text-sm py-3 px-4 hover:bg-[#1a1a1a] dark:hover:bg-border/50 transition-colors"
          >
            {isOpen ? "Hide other options" : "Show other options"}
          </button>
        </div>
        <AccordionContent className="pt-4">
          <div className="space-y-3">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
