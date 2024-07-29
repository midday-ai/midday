"use client";

import { useI18n } from "@/locales/client";
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
  const t = useI18n();

  return (
    <section className="container mb-16 md:mb-32">
      <div className="mb-12">
        <h2 className="text-4xl mb-4 font-medium">{t("sectionOSS.title")}</h2>
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
                  <span className="w-full text-left text-lg">
                    {t("sectionOSS.accordionOneTitle")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <div className="flex-col">
                    <p>{t("sectionOSS.accordionOneDescription")}</p>

                    <a
                      href="https://git.new/midday"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="mt-8 mb-2 border-primary text-primary"
                      >
                        {t("sectionOSS.accordionOneButton")}
                      </Button>
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdOutlineDiversity2 size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">
                    {t("sectionOSS.accordionTwoTitle")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <div className="flex-col">
                    <p>{t("sectionOSS.accordionTwoDescription")}</p>
                    <a
                      href="https://go.midday.ai/anPiuRx"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="mt-8 mb-2 border-primary text-primary"
                      >
                        {t("sectionOSS.accordionTwoButton")}
                      </Button>
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdEditRoad size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">
                    {t("sectionOSS.accordionThreeTitle")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <div className="flex-col">
                    <p>{t("sectionOSS.accordionThreeDescription")}</p>
                    <a
                      href="https://go.midday.ai/aTNyqQH"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        className="mt-8 mb-2 border-primary text-primary"
                      >
                        {t("sectionOSS.accordionThreeButton")}
                      </Button>
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="flex items-center justify-start space-x-2">
                  <MdOutlineAssuredWorkload size={32} className="!rotate-0" />
                  <span className="w-full text-left text-lg">
                    {t("sectionOSS.accordionFourTitle")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#707070]">
                  <p>{t("sectionOSS.accordionFourDescription")}</p>
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
