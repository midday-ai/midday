import Link from "next/link";
import { Card } from "./ui";

export function SectionSubscription() {
  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>How we will make money</span>
        <span className="text-[#878787]">
          <Link href="/">midday.ai</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="px-4 md:px-0 md:pt-0 h-[580px] md:h-auto overflow-auto pb-[100px] md:pb-0">
          <div className="mb-4">
            <h2 className="text-2xl">Tiers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0 md:mb-[80px] mb-12">
            <Card className="pb-8">
              <span className="py-1 px-4 bg-white text-black rounded-lg text-sm font-medium mb-4">
                Base
              </span>

              <h2 className="text-2xl">Free</h2>
              <p className="text-[#878787] text-sm text-center">
                We will offer a free limited plan for customers to get to know
                the system.
              </p>
            </Card>

            <Card className="pb-8">
              <span className="py-1 px-4 border border-border rounded-lg text-sm font-medium mb-4">
                Pro
              </span>

              <h2 className="text-2xl">TBD/ mo</h2>
              <p className="text-[#878787] text-sm text-center">
                This is the price new users will pay when we launch. The price
                is yet to be determined.
              </p>
            </Card>

            <Card className="pb-8">
              <span className="py-1 px-4 border border-border rounded-lg text-sm font-medium mb-4">
                Enterprise
              </span>

              <h2 className="text-2xl">TBD</h2>
              <p className="text-[#878787] text-sm text-center">
                This plan will be offered to bigger companies with lots of
                seats. This will be licensed based and the price is yet to be
                determined.
              </p>
            </Card>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl">Add ons</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0">
            <Card className="pb-8">
              <h2>Team seats</h2>
              <p className="text-[#878787] text-sm text-center">
                Additional team members will be per seat pricing. The team will
                have the ability to invite how many users they want.
              </p>
            </Card>

            <Card className="pb-8">
              <h2>Vault storage</h2>
              <p className="text-[#878787] text-sm text-center">
                A limit will be set to the storage since this is also a moving
                cost for us. Everything above that limit will cost the users
                extra. Price is yet to be determined.
              </p>
            </Card>

            <Card className="pb-8">
              <h2>Custom domain</h2>
              <p className="text-[#878787] text-sm text-center">
                If the user want a custom inbox email, for example
                acme.inbox@midday.ai, we can provide this for an additional fee.
              </p>
            </Card>
          </div>

          <div className="px-4 md:px-0">
            <a
              href="https://midday.ai/engine"
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <div className="ful-w p-4 border border-border bg-[#121212] px-6 mt-8 text-center flex flex-col justify-center items-center space-y-4 pb-8">
                <h2>Engine</h2>
                <p className="text-[#878787] text-sm text-center max-w-[800px]">
                  Midday Engine streamlines banking integrations with a single
                  API, effortlessly connecting to multiple providers and get one
                  unified format and UI. We currently utilize our Engine
                  internally, but we will soon offer it as a paid service.
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
