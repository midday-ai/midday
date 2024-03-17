import { BlurryCircle } from "@/components/blurry-circle";
import { CTAButtons } from "@/components/cta-buttons";
import { Testimonials } from "@/components/testimonials";
import { getStaticParams } from "@/locales/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Midday",
};

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setStaticParamsLocale(locale);

  return (
    <>
      <div className="container max-w-[800px]">
        <div className="h-screen">
          <h1 className="mt-24 font-medium text-center text-5xl mb-8">
            What it cost.
          </h1>

          <div className="flex items-center flex-col text-center relative">
            <h3 className="md:text-[344px] text-[244px] leading-[244px] font-medium md:leading-[344px]">
              30
            </h3>

            <p className="font-medium text-xl">
              Claim $30/mo early adopter plan
            </p>

            <span className="underline">free while in beta</span>

            <div className="mt-6">
              <CTAButtons />
            </div>

            <BlurryCircle className="absolute -top-[50px] right-[0px] bg-[#3633D0] bg-opacity-10 dark:bg-opacity-5" />
            <BlurryCircle className="absolute bottom-[160px] left-6 bg-[#A1F5CD] bg-opacity-15 dark:bg-opacity-5" />
            <BlurryCircle className="absolute bottom-0 right-[150px] bg-[#FFECBB] bg-opacity-15 dark:bg-opacity-5" />
          </div>
        </div>

        <div className="-mt-[150px]">
          <div className="text-center">
            <h4 className="text-4xl">Frequently asked questions</h4>
            <p className="text-[#878787] text-sm mt-4">
              Integer quis vestibulum lorem. Curabitur consectetur nulla nec
              justo
              <br />
              congue mattis. Nulla tincidunt ante eros, nec interdum dui varius
              quis.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full mt-10 mb-48">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <span className="truncate">Can I self-host Midday.ai?</span>
              </AccordionTrigger>
              <AccordionContent>
                Absolutely. Please refer to our docs for the latest guides and
                information on self-hosting the platform.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I run Midday.ai locally?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other
                components&apos; aesthetic.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is Midday.ai open source?</AccordionTrigger>
              <AccordionContent>
                Yes. It's animated by default, but you can disable it if you
                prefer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                <span className="truncate max-w-[300px] md:max-w-full">
                  What are your data privacy & security policies?
                </span>
              </AccordionTrigger>
              <AccordionContent>
                We take data privacy very seriously and implement
                state-of-the-art security measures to protect your data. We are
                also actively working towards SOC 2 Type II compliance. You can
                learn more about our data privacy policies at{" "}
                <Link href="/privacy">midday.co/privacy</Link>.
              </AccordionContent>
              <AccordionItem value="item-5">
                <AccordionTrigger>
                  <span className="truncate max-w-[300px] md:max-w-full">
                    Can I cancel my subscription at any time?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your subscription at any time. If you
                  cancel your subscription, you will still be able to use Midday
                  until the end of your billing period. After that, you will be
                  downgraded to the free plan.
                </AccordionContent>
              </AccordionItem>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>
                <span className="truncate max-w-[300px] md:max-w-full">
                  I have more questions about Midday.ai. How can I get in touch?
                </span>
              </AccordionTrigger>
              <AccordionContent>
                Sure, we're happy to answer any questions you might have. Just
                send us an email at{" "}
                <a href="mailto:support@midday.ai">support@midday.ai</a> and
                we'll get back to you as soon as possible.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      <Testimonials />
    </>
  );
}
