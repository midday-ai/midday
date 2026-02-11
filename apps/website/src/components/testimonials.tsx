"use client";

import Image from "next/image";
import type { Testimonial } from "./sections/testimonials-section";

const allTestimonials: Testimonial[] = [
  {
    name: "Ciarán Harris",
    title: "",
    company: "CogniStream",
    country: "Ireland",
    image: "/stories/ciaran.jpeg",
    content:
      "Financial admin stopped being a source of friction. Midday actually works the way you'd expect modern software to work.",
    fullContent:
      "Company\nCogniStream is an AI-moderated qualitative research platform. We have natural voice conversations with customers, analyse not just what they say but how they feel when they say it, and help businesses make confident decisions faster. I'm Ciarán Harris, CEO and Co-Founder, a two-time founder with over 25 years of research experience for global giants.\n\nChallenge\nI tried using Xero. It couldn't connect to my bank account reliably, the interface felt like it hadn't been updated in a decade, and just getting up and running was painful. It never worked out of the box. The real kicker? My accountant also used Xero, but he preferred I send him everything as a CSV anyway. That completely negated the point. As a founder, you need financial admin to just work so you can focus on building the business. It wasn't working.\n\nImpact\nFinancial admin stopped being a source of friction. Midday actually works the way you'd expect modern software to work. I check in every few days to keep on top of things, and every few weeks I'll do a more involved session to get through receipt scanning and matching ahead of VAT returns. It removed the single biggest pain point from my week-to-week financial admin, and everything else it does is a genuinely useful bonus on top of that.\n\nFavorite features\nReceipt scanning and matching, without question. That's the feature that removes the most friction from running the business day to day. Before, receipts were scattered and matching them to transactions was tedious. Now it's handled. That one feature alone justified the switch. The AI assistant is a nice bonus too, being able to ask a natural language question about your finances and get detailed results is genuinely useful.",
  },
  {
    name: "Vitalie Rosescu",
    title: "",
    company: "Awwwocado",
    country: "Netherlands",
    image: "/stories/vitalie.jpg",
    content:
      "All in one platform for freelancers looking to create clear insights on income and expenses.",
    fullContent:
      "Company\nAwwwocado is a Webflow development business.\n\nChallenge\nWhat I lacked in other software is the overview of which invoices were paid and which were pending, and seeing my overall income. Existing tools didn't give a clear picture of finances.\n\nImpact\nHaving a clear overview of income, invoices, and expenses in one place made managing the business much easier.\n\nFavorite features\nInvoices, because it's a big time saver.\nA clean share link for customers is very nice.\nExpenses being taken from my inbox and being able to upload expenses is a huge one.\nThe invoice template is clean out of the box and very customizable.",
  },
  {
    name: "Paweł Michalski",
    title: "",
    company: "VC Leaders",
    country: "Poland",
    image: "/stories/pawel.jpeg",
    content:
      "Invoice reconciliation used to take a full day each month and was always stressful. With Midday, that work is mostly gone and we finally have a clear financial overview.",
    fullContent:
      "Company\nVC Leaders is an educational platform helping venture capitalists build better VC firms.\n\nChallenge\nMonthly invoice reconciliation was slow and painful. Missing invoices, manual checks, and no time left to properly categorize or analyze spending. The process regularly took more than a full day.\n\nImpact\nMidday reduced invoice reconciliation time by 1–2 man-days per month and made financial visibility much clearer through dashboards.\n\nFavorite features\nClear financial overview, accounts payable tracking, invoice reconciliation, and a clean, intuitive interface.",
  },
  {
    name: "Facu Montanaro",
    title: "",
    company: "Kundo Studio",
    country: "Argentina",
    image: "/stories/facu.jpeg",
    content:
      "Managing invoicing, projects, and finances across tools slowed my daily work. Midday brought everything into one place and made my workflow much simpler.",
    fullContent:
      "Company\nKundo Studio helps startups and founders with fundraising, product launches, and growth through design and meaningful experiences.\n\nChallenge\nManaging invoicing, projects, and finances across multiple tools made daily work slower and more complex. Existing tools felt fragmented and hard to use.\n\nImpact\nMidday centralized invoicing, time tracking, and project information into one place, significantly simplifying day-to-day operations.\n\nFavorite features\nInvoicing and time tracking. Both became core parts of Facu's daily workflow and replaced multiple separate tools.",
  },
  {
    name: "Nick Speer",
    title: "",
    company: "Speer Technologies",
    country: "United States",
    image: "/stories/speer.jpeg",
    content:
      "Midday is bookkeeping software without the fluff. It's a ledger with modern tooling and integrations.",
    fullContent:
      "Company\nSpeer Technologies is an AI consulting firm in the US. We accelerate our clients' AI initiatives from problem discovery to production across industries including Finance, Healthcare, and Defense.\n\nChallenge\nI was spending too much time on weekends cleaning up my books, juggling invoices, and clicking around clunky software. It felt like another job, and the other solutions didn't work the way I wanted.\n\nImpact\nAfter switching from QuickBooks to Midday, it felt like I was in control of my books. I could see every transaction and expense as it came in and manage it without feeling overwhelmed.\n\nFavorite features\nAuto-categorization is far better than other programs, which saves time from manually organizing books. From there, I can export data and get insights into exact spending categories.",
  },
  {
    name: "Richard Poelderl",
    title: "",
    company: "Conduct",
    country: "Germany",
    image: "/stories/richard.jpeg",
    content:
      "My previous accounting setup was fragmented and didn't support my bank. Midday made invoicing easier and sharing clean data with my tax advisor straightforward.",
    fullContent:
      "Company\nRichard works with companies that want to focus product development on building great products while outsourcing growth and marketing execution.\n\nChallenge\nHis accounting tool didn't support his bank, required manual formatting of exports, and forced him to juggle multiple financial tools.\n\nImpact\nMidday replaced bank invoicing and made it easier to work with his tax advisor by exporting clean CSV files that integrate with accounting software. This significantly reduced friction while keeping control in one system.\n\nFavorite features\nInvoicing, CSV exports for tax advisors, and bank sync to track subscriptions and expenses.",
  },
  {
    name: "Ivo Dukov",
    title: "",
    company: "Smarch",
    country: "Bulgaria",
    content:
      "Everything lives in one place now — customers, invoices, documents, and financial analytics.",
    fullContent:
      "Company\nSmarch is a software development agency specializing in e-commerce, web applications, and custom backend systems.\n\nChallenge\nBefore Midday, I was manually creating PDF invoices, piecing together bank reports to understand how the company was doing, and collecting financial documents every time accounting needed something. It was scattered and tedious.\n\nImpact\nEverything lives in one place now. I set up invoice templates once, have all clients organized, get real analytics on company performance, and keep documents in a proper vault. What used to take hours of admin work is now streamlined and mostly automatic.\n\nFavorite features\nInvoice templates. They eliminate repetitive work when billing multiple clients.",
  },
  {
    name: "Guy Solan",
    title: "",
    company: "Thetis Medical",
    country: "United Kingdom",
    image: "/stories/guy.jpeg",
    content:
      "Without Midday, I had no real visibility into our cash and relied entirely on my accountant. It gave me clarity without having to learn complex accounting tools.",
    fullContent:
      "Company\nThetis Medical is a medical device company.\n\nChallenge\nWithout Midday, I had no real visibility into our cash and relied entirely on my accountant.\n\nImpact\nMidday gave me clarity without having to learn complex accounting tools.\n\nFavorite features\nFinancial visibility and cash flow tracking.",
    video:
      "https://customer-oh6t55xltlgrfayh.cloudflarestream.com/5b86803383964d52ee6834fd289f4f4e/manifest/video.m3u8",
    videoPoster: "https://cdn.midday.ai/guy-cover.png",
  },
];

function renderStructuredContent(content: string) {
  const sections = content.split("\n\n");
  const structured: { label: string; text: string }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]?.trim();
    if (!section) continue;

    const lines = section.split("\n");
    const firstLine = lines[0]?.trim();

    if (!firstLine) continue;

    if (
      firstLine.length < 30 &&
      /^[A-Z][a-z\s]+$/.test(firstLine) &&
      lines.length > 1
    ) {
      structured.push({
        label: firstLine,
        text: lines.slice(1).join("\n").trim(),
      });
    } else {
      if (structured.length > 0) {
        const lastSection = structured[structured.length - 1];
        if (lastSection) {
          lastSection.text = `${lastSection.text}\n\n${section}`;
        }
      } else {
        structured.push({ label: "", text: section });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {structured.map((section) => (
        <div
          key={section.label || section.text.slice(0, 20)}
          className="flex flex-col gap-2"
        >
          {section.label && (
            <p className="font-sans text-sm font-medium text-foreground">
              {section.label}
            </p>
          )}
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            {section.text}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-background pt-32 pb-24">
        <div className="max-w-[1400px] mx-auto mb-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">
              Customer Stories
            </h1>
            <p className="font-sans text-base text-muted-foreground leading-normal mb-8">
              See how founders and small teams use Midday to manage their
              finances and run their businesses.
            </p>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto">
          <div className="h-px w-full border-t border-border" />
        </div>
      </div>

      {/* Testimonials List */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-12 sm:pb-16 lg:pb-24">
        <div className="space-y-16 sm:space-y-20 lg:space-y-24">
          {allTestimonials.map((testimonial, index) => (
            <div
              key={`testimonial-${testimonial.name}-${index}`}
              className={
                index === 0
                  ? ""
                  : "border-t border-border pt-12 sm:pt-16 lg:pt-20"
              }
            >
              <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
                {/* Quote Section */}
                <div className="space-y-6">
                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    {testimonial.image && (
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        style={{ filter: "grayscale(100%)" }}
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <h2 className="font-sans text-base sm:text-lg font-medium text-foreground">
                        {testimonial.name}
                      </h2>
                      <p className="font-sans text-sm text-muted-foreground">
                        {testimonial.company}
                        {testimonial.country && (
                          <span className="text-muted-foreground/70">
                            {" "}
                            · {testimonial.country}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Big Quote */}
                  <blockquote className="font-sans text-lg sm:text-xl lg:text-2xl text-foreground leading-normal sm:leading-relaxed">
                    &quot;{testimonial.content}&quot;
                  </blockquote>
                </div>

                {/* Divider */}
                <div className="h-px w-full border-t border-border" />

                {/* Full Content */}
                <div className="space-y-6">
                  {renderStructuredContent(testimonial.fullContent)}
                </div>

                {/* Video if available */}
                {testimonial.video && (
                  <div className="w-full overflow-hidden bg-muted border border-border">
                    <video
                      className="w-full h-auto"
                      controls
                      playsInline
                      preload="metadata"
                      poster={testimonial.videoPoster}
                      style={{ filter: "grayscale(100%)" }}
                    >
                      <source src={testimonial.video} />
                      <track kind="captions" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
