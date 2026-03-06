"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { PlanCards } from "@midday/ui/plan-cards";

export function PricingSection() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <PlanCards
          footnote="14-day free trial"
          renderAction={() => (
            <>
              <Button
                asChild
                className="w-full btn-inverse font-sans text-sm py-3 px-4 transition-colors"
              >
                <a
                  href="https://app.midday.ai/"
                  onClick={() =>
                    track({
                      event: LogEvents.CTA.name,
                      channel: LogEvents.CTA.channel,
                      label: "Start your trial",
                      position: "pricing",
                      plan: "starter",
                    })
                  }
                >
                  Start your trial
                </a>
              </Button>
            </>
          )}
        />
      </div>
    </section>
  );
}
