import type { Metadata } from "next";
import Image from "next/image";
import { baseUrl } from "@/app/sitemap";

const title = "Story";
const description =
  "Why we built Midday. Learn about our mission to help founders and small teams stay on top of their business finances without the manual work.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/story`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/story`,
  },
};

export default function StoryPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-32 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Title */}
            <div className="space-y-4 text-center">
              <h1 className="font-serif text-3xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3] text-foreground">
                Why we started Midday
              </h1>
            </div>

            {/* Content */}
            <div className="prose prose-sm sm:prose-base max-w-none space-y-8 font-sans text-foreground">
              {/* The problem */}
              <section className="space-y-4">
                <h2 className="font-sans text-base text-foreground">
                  The problem
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Running a business shouldn't require constant checking just to
                  know where things stand.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  After years of running our own companies, we kept running into
                  the same friction. Time tracking lived in one place. Invoices
                  in another. Receipts scattered across inboxes and folders.
                  Transactions buried in bank dashboards. And when something
                  changed, you often found out too late or only after digging
                  through numbers.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Most tools handling this work focus on individual tasks. They
                  rarely work together, and even more rarely help you stay on
                  top of your business without manual effort. The result is too
                  much context switching, too many tools, and a constant feeling
                  of being slightly behind.
                </p>
              </section>

              {/* Divider */}
              <div className="flex items-center justify-center py-8">
                <div className="h-px w-full max-w-xs border-t border-border" />
              </div>

              {/* The idea */}
              <section className="space-y-4">
                <h2 className="font-sans text-base text-foreground">
                  The idea
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We didn't want another finance tool. We wanted a system that
                  works for you.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Midday is built around the idea that your finances should stay
                  reconciled, explained, and monitored as your business changes
                  — without you having to constantly check dashboards or chase
                  updates. Time, invoices, receipts, transactions, and documents
                  shouldn't live in silos. They should reinforce each other and
                  reflect what's actually happening.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Instead of pulling information out of the system, Midday
                  pushes the right information to you. Summaries, notifications,
                  and clear signals help you understand what's changed, what
                  needs attention, and what's on track. That way, you stay
                  informed without living inside financial software.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Midday doesn't replace your accountant. It sits in between,
                  keeping everything organized, connected, and ready, so
                  conversations are easier and decisions are based on up-to-date
                  information.
                </p>
              </section>

              {/* Divider */}
              <div className="flex items-center justify-center py-8">
                <div className="h-px w-full max-w-xs border-t border-border" />
              </div>

              {/* What we're focused on */}
              <section className="space-y-4">
                <h2 className="font-sans text-base text-foreground">
                  What we're focused on
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Midday is built for founders and small teams who want to feel
                  on top of their business without spending their time managing
                  financial admin.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We focus on:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Reducing manual and repetitive work</li>
                  <li>Keeping financial data consistent and reliable</li>
                  <li>Surfacing the right information at the right time</li>
                  <li>Making it easy to understand what's happening and why</li>
                  <li>
                    Building software that works quietly in the background
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Our goal is simple: when you use Midday, you shouldn't have to
                  wonder how your business is doing.
                </p>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Your finances should explain themselves.
                </p>
              </section>
            </div>

            {/* Founders Image */}
            <div className="w-full space-y-3">
              <Image
                src="/founders.png"
                alt="Founders"
                width={1200}
                height={450}
                className="w-full h-[350px] sm:h-[450px] object-cover object-center"
                priority
              />
              <div className="text-left">
                <p className="font-sans text-sm text-primary">
                  Pontus & Viktor
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  Founders, Midday
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
