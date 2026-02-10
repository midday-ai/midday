"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import type { Competitor } from "@/data/competitors";

interface Differentiator {
  title: string;
  description: string;
}

interface Section {
  id: string;
  label: string;
}

interface Props {
  competitor: Competitor;
  differentiators: Differentiator[];
  sections: Section[];
}

export function ComparisonHero({
  competitor,
  differentiators,
  sections,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">
          Best {competitor.name} Alternative for Founders
        </h1>
        <p className="font-sans text-base text-muted-foreground leading-normal mb-8 max-w-2xl">
          {competitor.description} Compare features, pricing, and see why teams
          are switching to Midday.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <Button asChild className="btn-inverse h-11 px-6">
            <a href="https://app.midday.ai/">Get started now</a>
          </Button>
          <Button asChild variant="outline" className="h-11 px-6">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>

        {/* Key Differentiators */}
        <div className="flex flex-wrap gap-3">
          {differentiators.map((diff) => (
            <div key={diff.title} className="border border-border px-3 py-1.5">
              <span className="font-sans text-sm text-foreground">
                {diff.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar - Table of Contents */}
      <div className="lg:col-span-1">
        <div className="border border-border p-6 sticky top-32">
          <h2 className="font-sans text-sm text-muted-foreground mb-4">
            On this page
          </h2>
          <nav>
            <ul className="space-y-3">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="font-sans text-sm text-foreground hover:text-muted-foreground transition-colors"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
