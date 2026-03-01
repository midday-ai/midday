"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. You can upgrade or downgrade at any time. Changes take effect on your next billing cycle.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Your data stays safe. You keep access until the end of your billing period and can reactivate anytime.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Your data is always yours. Export transactions, receipts, invoices, and reports whenever you need.",
  },
];

export function UpgradeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-12 max-w-xl mx-auto">
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={faq.question}
            className="border border-border bg-background"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
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
              <div className="px-3 pb-3">
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
