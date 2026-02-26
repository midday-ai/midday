"use client";

import { useTRPC } from "@/trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { use, useState } from "react";

const faqs = [
  {
    question: "Why was my payment returned?",
    answer:
      "A payment can be returned if there are not enough funds in your bank account. This is sometimes called an NSF (Non-Sufficient Funds). When this happens, the payment will be retried on the next business day. If you see multiple returned payments, contact your funder to discuss options.",
  },
  {
    question: "Can I change my bank account?",
    answer:
      "Yes, you can request a bank account change. Send a message to your funder using the form below with your new bank details. They will update your account and confirm the change.",
  },
  {
    question: "How do I pay off early?",
    answer:
      'You can request a payoff letter from the "Request Payoff" tab. This will show your exact payoff amount. Once you receive the letter, you can send a wire or ACH payment to close out your deal.',
  },
  {
    question: "Why is my balance different than what I expected?",
    answer:
      "Your balance reflects all payments processed to date. If a payment was returned, it would not reduce your balance. Check your payment history for any returned or pending payments that may explain the difference.",
  },
  {
    question: "What happens if I miss a payment?",
    answer:
      "If a scheduled payment cannot be processed, it will be marked as returned. Your funder will typically retry the payment on the next business day. Multiple missed payments may result in your deal being marked as late. Contact your funder if you are having trouble making payments.",
  },
  {
    question: "Can I get a lower daily payment?",
    answer:
      "Payment amounts are set when your deal is funded. However, some funders may be willing to adjust payment terms in certain circumstances. Contact your funder to discuss your options.",
  },
  {
    question: "I need a copy of my contract",
    answer:
      'Your contract and other documents are available in the "Documents" tab. If you cannot find what you need, send a message to your funder and they will provide it.',
  },
  {
    question: "How do I update my phone number or email?",
    answer:
      "Send a message to your funder using the form below with your updated contact information. They will update your records.",
  },
  {
    question: "I want to apply for more funding",
    answer:
      "Contact your funder to discuss additional funding. They will review your current deal performance and let you know what options are available.",
  },
  {
    question: "Who do I contact about a problem?",
    answer:
      "You can send a message using the form below, or call your funder directly using the phone number listed on this page. Messages are typically answered within one business day.",
  },
];

export default function HelpPage({
  params,
}: {
  params: Promise<{ portalId: string }>;
}) {
  const { portalId } = use(params);
  const trpc = useTRPC();
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageEmail, setMessageEmail] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const sendMessage = useMutation(
    trpc.merchantPortal.sendMessage.mutationOptions(),
  );

  const handleSendMessage = async () => {
    if (!messageBody || !messageEmail) return;
    try {
      await sendMessage.mutateAsync({
        portalId,
        subject: messageSubject || undefined,
        message: messageBody,
        fromEmail: messageEmail,
      });
      setMessageSent(true);
      setMessageSubject("");
      setMessageBody("");
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif">Help & Support</h1>

      {/* Contact Methods */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-medium mb-4">Contact Your Funder</h2>
          <div className="space-y-3">
            <a
              href="tel:+18005551234"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors min-h-[52px]"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 flex-shrink-0">
                <Icons.Accounts className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Call Us</div>
                <div className="text-xs text-muted-foreground">
                  Available Monday–Friday, 9AM–6PM ET
                </div>
              </div>
            </a>
            <a
              href="mailto:support@example.com"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors min-h-[52px]"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 flex-shrink-0">
                <Icons.Email className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Email Us</div>
                <div className="text-xs text-muted-foreground">
                  We reply within 1 business day
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-medium mb-4">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left min-h-[48px]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Message Form */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-medium mb-4">Send Us a Message</h2>

          {messageSent ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-start gap-2">
              <Icons.Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Message sent!</p>
                <p className="mt-1">
                  We will reply to your email within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={() => setMessageSent(false)}
                  className="text-green-700 underline mt-2"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs text-muted-foreground mb-1"
                >
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={messageEmail}
                  onChange={(e) => setMessageEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg min-h-[44px]"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-xs text-muted-foreground mb-1"
                >
                  Subject (optional)
                </label>
                <input
                  id="subject"
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="What is this about?"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg min-h-[44px]"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-xs text-muted-foreground mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none"
                />
              </div>

              {sendMessage.isError && (
                <p className="text-sm text-red-600">
                  {sendMessage.error.message}
                </p>
              )}

              <Button
                onClick={handleSendMessage}
                disabled={
                  sendMessage.isPending || !messageBody || !messageEmail
                }
                className="w-full min-h-[48px] text-base"
                size="lg"
              >
                {sendMessage.isPending ? (
                  <Spinner size={16} className="mr-2" />
                ) : null}
                Send Message
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
