import { Button } from "@midday/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export function WhiteLabelPlans() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
        {/* Standard Plan */}
        <div className="flex flex-col p-8 border bg-background ">
          <h2 className="text-xl mb-2">Standard</h2>
          <div className="mt-4 flex items-baseline">
            <span className="text-[40px] font-medium tracking-tight">
              $12,999
            </span>
            <span className="ml-1 text-xl font-medium">/mo</span>
            <span className="ml-2 text-xs text-muted-foreground">
              Excl. VAT
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            12-month contract
          </p>

          <div className="mt-8">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground font-mono">
              INCLUDING
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">
                  Access to Midday's full suite of features
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">
                  All future updates and improvements
                </span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">
                  Banking provider{" "}
                  <Link
                    href="/engine"
                    className="underline underline-offset-4 underline-dashed"
                  >
                    engine
                  </Link>
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t">
            <a
              href="https://cal.com/pontus-midday/white-label-midday"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="w-full h-12">
                Schedule a call
              </Button>
            </a>
          </div>
        </div>

        {/* Long Term Plan */}
        <div className="flex flex-col p-8 border border-primary bg-background  relative">
          <div className="absolute top-0 right-0 mr-6 mt-8 rounded-full text-[#878787] text-[9px] font-normal border px-2 py-1 font-mono">
            Most popular
          </div>
          <h2 className="text-xl mb-2">Long term</h2>
          <div className="mt-4 flex items-baseline">
            <span className="text-[40px] font-medium tracking-tight">
              $9,999
            </span>
            <span className="ml-1 text-xl font-medium">/mo</span>
            <span className="ml-2 text-xs text-muted-foreground">
              Excl. VAT
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            24-month contract
          </p>

          <div className="mt-8">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground font-mono">
              INCLUDING
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">Everything in the Standard Plan</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">
                  Discounted for committing to a longer term
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-16 pt-8 border-t">
            <a
              href="https://cal.com/pontus-midday/white-label-midday"
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full h-12">Schedule a call</Button>
            </a>
          </div>
        </div>

        {/* Foundation Plan */}
        <div className="flex flex-col p-8 border bg-background ">
          <h2 className="text-xl mb-2">Foundation</h2>
          <div className="mt-4 flex items-baseline">
            <span className="text-[40px] font-medium tracking-tight">
              $19,999
            </span>
            <span className="ml-1 text-xl font-medium">/mo</span>
            <span className="ml-2 text-xs text-muted-foreground">
              Excl. VAT
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            24-month contract
          </p>

          <div className="mt-8">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground font-mono">
              INCLUDING
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">Everything in the Standard Plan</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">Priority support and setup</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                <span className="text-sm">
                  Dedicated onboarding and integration assistance
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t">
            <a
              href="https://cal.com/pontus-midday/white-label-midday"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="w-full h-12">
                Schedule a call
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground max-w-6xl mx-auto font-mono">
        Infrastructure, banking providers and other third-party services are not
        included. The codebase will be maintained in the Midday repository, with
        updates and fixes made there. It is the customer's responsibility to
        stay updated with these changes after the initial setup is completed.
      </div>
    </div>
  );
}
