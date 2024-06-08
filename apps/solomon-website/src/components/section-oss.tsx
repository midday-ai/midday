import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import Link from "next/link";
import {
  MdDataArray,
  MdEditRoad,
  MdOutlineAssuredWorkload,
  MdOutlineDiversity2,
} from "react-icons/md";
import { GithubStats } from "./github-stats";

export function SectionOSS() {
  return (
    <section className="container mb-16 md:mb-32">
      <div className="mb-12">
        <h2 className="text-4xl mb-4 font-medium">Open startup</h2>
        <p className="text-[#707070] max-w-[500px]">
          We believe in being as transparent as possible, from{" "}
          <a
            href="https://git.new/midday"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            code
          </a>{" "}
          to{" "}
          <Link href="/open-startup" className="underline">
            metrics
          </Link>
          . You can also{" "}
          <Link href="/feature-request" className="underline">
            request a feature
          </Link>{" "}
          and vote on which ones we should prioritize.
        </p>
      </div>

      <div className="border border-border bg-[#121212] p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:space-x-16">
          <div className="md:basis-1/2">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="item-1"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdDataArray size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">Open source</span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <div className="flex-col">
                    <p>
                      All of our code is fully open source, clone, fork and
                      contribute to Midday.
                    </p>

                    <a
                      href="https://git.new/midday"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="mt-8 mb-2 border-primary text-primary"
                      >
                        View repository
                      </Button>
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdOutlineDiversity2 size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">Community</span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <div className="flex-col">
                    <p>
                      A welcoming community of hundreds of developers that
                      shares expertise and offers support.
                    </p>
                    <a
                      href="https://go.midday.ai/anPiuRx"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="mt-8 mb-2 border-primary text-primary"
                      >
                        Join the community
                      </Button>
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdEditRoad size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">Open roadmap</span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <div className="flex-col">
                    <p>
                      Missing a feature? Start a discussion, report an issue,
                      contribute the code, or even fork the repository.
                    </p>
                    <a
                      href="https://go.midday.ai/aTNyqQH"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="mt-8 mb-2 border-primary text-primary"
                      >
                        Open roadmap
                      </Button>
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdOutlineAssuredWorkload size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">Security</span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  Benefit from the collective oversight of a global community
                  that quickly identifies and resolves issues. The data are
                  secured at rest, sensitive data are also encrypted at column
                  level. You can also enable 2FA for extra security.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="md:basis-1/2">
            <a href="https://git.new/midday" target="_blank" rel="noreferrer">
              <div className="aspect-square md:max-h-[280px] w-full md:border border-border md:p-10 mt-0 md:mt-0">
                <div className="md:border-b-[1px] border-border pb-8 mb-8">
                  <h3 className="font-medium text-xl md:text-2xl hidden md:block">
                    Midday
                  </h3>
                </div>

                <div>
                  <div className="flex space-x-2 overflow-auto scrollbar-hide">
                    <span className="border border-border py-1.5 px-4 text-sm rounded-full">
                      finance
                    </span>
                    <span className="border border-border py-1.5 px-4 text-sm rounded-full">
                      typescript
                    </span>
                    <span className="border border-border py-1.5 px-4 text-sm rounded-full">
                      nextjs
                    </span>
                    <span className="border border-border py-1.5 px-4 text-sm rounded-full">
                      tailwind
                    </span>
                    <span className="border border-border py-1.5 px-4 text-sm rounded-full">
                      supabase
                    </span>
                  </div>
                </div>

                <GithubStats />
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
