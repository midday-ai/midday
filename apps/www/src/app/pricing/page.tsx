import type { Metadata } from "next";
import Link from "next/link";
import { Testimonials } from "@/components/testimonials";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function Page() {
  return (
    <>
      <div className="container">
        <div className="min-h-[950px]">
          <h1 className="mb-2 mt-24 text-center text-[100px] font-medium leading-none md:text-[170px]">
            $50/mo
          </h1>

          <h3 className="text-stroke mb-2 text-center text-[100px] font-medium leading-none md:text-[170px]">
            or $500/yr
          </h3>

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-12 mt-12" />
            {/* <p className="text-xl mt-4">Claim $30/mo deal</p> */}

            <div className="mt-8">
              <div className="flex items-center space-x-4">
                <Link href="/talk-to-us">
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border border-primary px-6"
                  >
                    Talk to us
                  </Button>
                </Link>

                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://app.solomon-ai.app"
                >
                  <Button className="h-12 rounded-2xl px-5">
                    Get Early Access
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-[800px]">
          <div className="-mt-[200px]">
            <div className="text-center">
              <h4 className="text-4xl">Frequently asked questions</h4>
            </div>

            <Accordion type="single" collapsible className="mb-48 mt-10 w-full">
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  Is Solomon AI.ai open source?
                </AccordionTrigger>
                <AccordionContent>
                  Yes. You can find the repository{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/SolomonAIEngineering/orbitkit"
                    className="underline"
                  >
                    here
                  </a>
                  .
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  <span className="max-w-[300px] truncate md:max-w-full">
                    What are your data privacy & security policies?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  We take data privacy very seriously and implement
                  state-of-the-art security measures to protect your data. We
                  are also actively working towards SOC 2 Type II compliance. We
                  encrypt data at rest, and sensitive data on row level. We also
                  support 2FA authentication.
                  <Link href="/policy">solomon-ai.app/policy</Link>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  <span className="max-w-[300px] truncate md:max-w-full">
                    Can I cancel my subscription at any time?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your subscription at any time. If you
                  cancel your subscription, you will still be able to use
                  Solomon AI until the end of your billing period.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  <span className="max-w-[300px] truncate md:max-w-full">
                    I have more questions about Solomon AI. How can I get in
                    touch?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Sure, we're happy to answer any questions you might have. Just
                  send us an email at{" "}
                  <a href="mailto:yoanyomba@solomon-ai.co">
                    yoanyomba@solomon-ai.co
                  </a>{" "}
                  and we'll get back to you as soon as possible.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <Testimonials />
    </>
  );
}
