import Image from "next/image";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Story",
  description:
    "Why we built Midday. Learn about our mission to help one-person companies stay on top of their business finances without the manual work.",
  path: "/story",
  og: { title: "Our Story", description: "Why we built Midday" },
});

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
                  Running a company used to mean building a team. Today, more
                  companies are run by one person.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  AI, automation and the internet make it possible to design,
                  sell, deliver and operate a real business alone. These are
                  one-person companies, and they are becoming more common every
                  year. But the software world has not caught up.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Most business tools still assume you have a team. Time
                  tracking lives in one place. Invoices in another. Receipts end
                  up across inboxes and folders. Transactions sit inside bank
                  dashboards. To understand how your company is doing, you often
                  have to jump between tools, reconcile numbers manually and
                  piece the story together yourself.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  For someone running a company alone, that overhead adds up
                  quickly. You are not lacking information. You are lacking a
                  system that keeps everything connected.
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
                  We did not want to build another finance tool. We wanted to
                  build a system where everything stays connected without you
                  having to hold it together.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Midday keeps the moving parts of your business connected as
                  things change, without you constantly checking dashboards or
                  digging through reports. Invoices, receipts, transactions,
                  time and documents should not live in silos. They should
                  reinforce each other and reflect what is actually happening in
                  your business.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Instead of pulling information out of the system, Midday
                  pushes the right information to you. Clear summaries,
                  notifications and signals help you understand what has
                  changed, what needs attention and what is on track. This way
                  you stay informed without living inside admin software.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Midday does not replace your accountant. It sits in between
                  and keeps everything organized and ready so conversations are
                  easier and decisions are based on up to date information.
                </p>
              </section>

              {/* Divider */}
              <div className="flex items-center justify-center py-8">
                <div className="h-px w-full max-w-xs border-t border-border" />
              </div>

              {/* What we are focused on */}
              <section className="space-y-4">
                <h2 className="font-sans text-base text-foreground">
                  What we are focused on
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Midday is built for founders who run real businesses without
                  building large teams and who want to stay on top of their
                  company without spending their time managing admin.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We focus on reducing manual and repetitive work, keeping
                  business data consistent and reliable, surfacing the right
                  information at the right time, and making it easy to
                  understand what is happening and why. Most importantly, we
                  build software that works quietly in the background.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our goal is simple. When you run the whole company yourself,
                  you should not have to spend your time managing admin.
                </p>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Your business should stay organized and explain itself as it
                  runs.
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
