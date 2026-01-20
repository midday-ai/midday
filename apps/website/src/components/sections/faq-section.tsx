"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is Midday?",
    answer:
      "Midday is a financial workspace for founders and small teams. It brings transactions, receipts, invoices, time tracking, and files into one connected system so you always know what's going on in your business.",
  },
  {
    question: "Who is Midday for?",
    answer:
      "Midday is built for solo founders, freelancers, and small teams who want clarity and control over their business finances without spending time on manual admin or spreadsheets.",
  },
  {
    question: "Do I need financial or accounting knowledge to use Midday?",
    answer:
      "No. Midday is designed for day-to-day use by non-financial users. It helps you stay organized, informed, and in control without requiring accounting expertise.",
  },
  {
    question: "How does Midday connect to my bank?",
    answer:
      "Midday connects to over 25,000 banks worldwide. Once connected, transactions are imported automatically and kept up to date.",
  },
  {
    question: "How do receipts and invoices get into Midday?",
    answer:
      "Receipts and invoices can be pulled automatically from connected email accounts, synced from existing folders, or uploaded manually. They are then matched to transactions so everything stays organized.",
  },
  {
    question: "What does the Assistant do?",
    answer:
      "The Assistant helps you understand your business. You can ask questions about revenue, expenses, cash flow, customers, or recent changes and get clear answers, summaries, and reports based on your real data.",
  },
  {
    question: "What are weekly updates?",
    answer:
      "Weekly updates are automatic summaries that highlight what changed in your business and what's worth paying attention to, so you don't have to check everything constantly.",
  },
  {
    question: "Can I create invoices in Midday?",
    answer:
      "Yes. You can create one-off, recurring, scheduled, and web invoices. Invoice activity is reflected directly in your financial overview.",
  },
  {
    question: "Does time tracking connect to invoicing?",
    answer:
      "Yes. Tracked time can be linked to projects and customers and turned into invoices, keeping work, revenue, and customers connected.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Your data is always yours. You can export transactions, receipts, invoices, and reports whenever you need, or share them with external tools or collaborators.",
  },
  {
    question: "Is Midday secure?",
    answer:
      "Yes. Midday uses industry-standard security practices to protect your data. You control what gets connected and shared at all times.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time as your business grows or your needs change.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. All plans include a 14-day free trial. A credit card is required to get started, and you won't be charged until the trial ends.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Frequently asked questions
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
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
    </section>
  );
}
