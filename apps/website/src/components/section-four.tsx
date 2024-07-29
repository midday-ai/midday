"use client";

import { useI18n } from "@/locales/client";
import Image from "next/image";
import inbox from "public/inbox.png";
import invoicing from "public/invoicing.png";
import { CopyInput } from "./copy-input";

export function SectionFour() {
  const t = useI18n();

  return (
    <section className="flex justify-between space-y-12 md:space-y-0 md:space-x-8 flex-col md:flex-row overflow-hidden mb-12">
      <div className="border border-border basis-1/3 bg-[#121212] p-10 md:text-center flex flex-col">
        <span className="text-[#F5F5F3] border border-border rounded-full self-start font-medium font-mono px-3 text-xs py-1.5 mb-4 bg-[#1D1D1D]">
          {t("general.comingSoon")}
        </span>
        <h4 className="font-medium text-xl md:text-2xl mb-4">
          {t("sectionFour.title")}
        </h4>
        <p className="text-[#878787] mb-[35px] text-sm">
          {t("sectionFour.description")}
        </p>

        <Image
          src={invoicing}
          quality={100}
          className="object-contain mt-auto"
          alt="Invoice"
        />
      </div>

      <div className="border border-border md:basis-2/3 bg-[#121212] p-10 flex justify-between md:space-x-8 md:flex-row flex-col">
        <div className="flex flex-col md:basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            {t("sectionFour.titleTwo")}
          </h4>

          <p className="text-[#878787] mb-4 text-sm">
            {t("sectionFour.descriptionTwo")}
          </p>

          <ul className="list-decimal pl-4 space-y-3">
            <li className="text-[#878787] text-sm">
              {t("sectionFour.bulletOne")}
            </li>
            <li className="text-[#878787] text-sm">
              {t("sectionFour.bulletTwo")}
            </li>
            <li className="text-[#878787] text-sm">
              {t("sectionFour.bulletThree")}
            </li>
          </ul>

          <CopyInput
            value="inbox.f3f1s@midday.ai"
            className="max-w-[240px] mt-8"
          />
        </div>

        <div className="md:basis-1/2 mt-8 md:mt-0 -bottom-[8px] relative">
          <Image
            src={inbox}
            quality={100}
            className="object-contain -bottom-[32px] relative"
            alt="Inbox"
          />
        </div>
      </div>
    </section>
  );
}
