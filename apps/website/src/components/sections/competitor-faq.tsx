"use client";

import { useState } from "react";
import type { Competitor } from "@/data/competitors";

interface Props {
  competitor: Competitor;
}

export function CompetitorFAQ({ competitor }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-4 text-center">
        Frequently asked questions
      </h2>
      <p className="font-sans text-base text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
        Common questions about switching from {competitor.name} to Midday.
      </p>

      <div className="max-w-3xl mx-auto space-y-4">
        {competitor.faq.map((faq, index) => (
          <div
            key={faq.question}
            className="border border-border bg-background"
          >
            <button
              type="button"
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-muted/50 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <span className="font-sans text-sm text-foreground pr-6">
                {faq.question}
              </span>
              <span className="flex-shrink-0 text-muted-foreground text-base">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
