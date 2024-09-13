import Link from "next/link";

import { Card } from "./ui";

export function SectionSubscription() {
  return (
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>How we will make money</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI </Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="h-[580px] overflow-auto px-4 pb-[100px] md:h-auto md:px-0 md:pb-0 md:pt-0">
          <div className="mb-4">
            <h2 className="text-2xl">Tiers</h2>
          </div>

          <div className="mb-12 grid gap-8 px-4 md:mb-[80px] md:grid-cols-3 md:px-0 md:pt-0">
            <Card className="pb-8">
              <span className="mb-4 rounded-lg bg-white px-4 py-1 text-sm font-medium text-black">
                Base
              </span>

              <h2 className="text-2xl">$100/mo</h2>
              <p className="text-center text-sm text-[#878787]">
                We will offer a base plan for doctos running single location
                practices to get to know the system and get started with a base
                set of features.
              </p>
            </Card>

            <Card className="pb-8">
              <span className="mb-4 rounded-lg border border-border px-4 py-1 text-sm font-medium">
                Multi-Location Practices
              </span>

              <h2 className="text-2xl">$200/location/mo</h2>
              <p className="text-center text-sm text-[#878787]">
                This tier caters to multi-location practices. They will have
                access to more in depth features some of which include custom
                financial health assessments, multi-year scenario simulation,
                practice risk identification, and many more.
              </p>
            </Card>

            <Card className="pb-8">
              <span className="mb-4 rounded-lg border border-border px-4 py-1 text-sm font-medium">
                Enterprise
              </span>

              <h2 className="text-2xl">$1500/mo base-fee</h2>
              <p className="text-center text-sm text-[#878787]">
                This plan will be offered to medical groups and hospitals
                companies with lots of seats. This will be licensed based and
                the price is yet to be determined.
              </p>
            </Card>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl">Add ons</h2>
          </div>

          <div className="grid gap-8 px-4 md:grid-cols-3 md:px-0 md:pt-0">
            <Card className="pb-8">
              <h2 className="text-xl font-bold">Team seats</h2>
              <p className="text-center text-sm text-[#878787]">
                Additional team members will be per seat pricing. The team will
                have the ability to invite how many users they want.
              </p>
            </Card>

            <Card className="pb-8">
              <h2 className="text-xl font-bold">Vault storage</h2>
              <p className="text-center text-sm text-[#878787]">
                A limit will be set to the storage since this is also a moving
                cost for us. Everything above that limit will cost the users
                extra. Price is yet to be determined.
              </p>
            </Card>

            <Card className="pb-8">
              <h2 className="text-xl font-bold">Custom domain</h2>
              <p className="text-center text-sm text-[#878787]">
                If the user want a custom inbox email, for example
                acme.inbox@solomon-ai.app, we can provide this for an additional
                fee.
              </p>
            </Card>
            <Card className="pb-8">
              <h2 className="text-xl font-bold">Autonomous Agent (Advanced)</h2>
              <p className="text-center text-sm text-[#878787]">
                If teams want their autonomous agent to take actions on their
                behalf such as alerting based on newly found risks, or taking
                actions to mitigate risks, we can provide this for an additional
                fee.
              </p>
            </Card>
            <Card className="pb-8">
              <h2 className="text-xl font-bold">Automations</h2>
              <p className="text-center text-sm text-[#878787]">
                Automations such as auto-report generation, auto-risk
                assessments, and many more will be offered at a fee
              </p>
            </Card>
            <Card className="pb-8">
              <h2 className="text-xl font-bold">AI Knowledge</h2>
              <p className="text-center text-sm text-[#878787]">
                Knowledge bases which a practice's autonomous agent will
                leverage in driving decision making for the practice will incur
                an additional fee based on the type of integration added to the
                knowledge base as well as the volume of data added.
              </p>
            </Card>
          </div>

          <div className="px-4 md:px-0">
            <a
              href="https://solomon-ai.app/engine"
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <div className="ful-w mt-8 flex flex-col items-center justify-center space-y-4 border border-border bg-[#121212] p-4 px-6 pb-8 text-center">
                <h2 className="text-xl font-bold">Engine</h2>
                <p className="max-w-[800px] text-center text-sm text-[#878787]">
                  Solomon AI Engine streamlines banking integrations with a
                  single API, effortlessly connecting to multiple providers and
                  get one unified format and UI. We currently utilize our Engine
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
