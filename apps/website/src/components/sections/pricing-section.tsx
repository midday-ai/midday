"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { PlanCards } from "@midday/ui/plan-cards";

export function PricingSection() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Pricing that matches how you run your business
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal">
            Start simple, upgrade when your workflow gets more complex.
          </p>
        </div>

        <PlanCards
          footnote="14-day free trial"
          renderStarterAction={() => (
            <>
              <Button
                asChild
                className="w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors"
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
              <p className="font-sans text-xs text-muted-foreground text-center">
                Best for getting started
              </p>
            </>
          )}
          renderProAction={() => (
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
                      plan: "pro",
                    })
                  }
                >
                  Start your trial
                </a>
              </Button>
              <p className="font-sans text-xs text-muted-foreground text-center">
                Best value for most businesses
              </p>
            </>
          )}
        />
      </div>
    </section>
  );
}
