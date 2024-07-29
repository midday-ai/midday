"use client";

import { useI18n } from "@/locales/client";
import Image from "next/image";
import timetracker from "public/time-tracker.png";

export function SectionThree() {
  const t = useI18n();

  return (
    <section className="relative mb-12">
      <div className="border border-border container bg-[#121212] p-8 md:p-10 md:pb-0 overflow-hidden">
        <div className="flex flex-col md:space-x-12 md:flex-row">
          <div className="mt-6 md:max-w-[40%] md:mr-8 md:mb-8">
            <h3 className="font-medium text-xl md:text-2xl	mb-4">
              {t("sectionThree.title")}
            </h3>

            <p className="text-[#878787] mb-4 text-sm">
              {t("sectionThree.description")}
              <br />
              {t("sectionThree.description_2")}
            </p>

            <div className="flex space-x-2 items-center mt-8 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={13}
                fill="none"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-[#878787]">
                {t("sectionThree.bulletOne")}
              </span>
            </div>
            <div className="flex space-x-2 items-center mt-1 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={13}
                fill="none"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-[#878787]">
                {t("sectionThree.bulletTwo")}
              </span>
            </div>

            <div className="flex space-x-2 items-center mt-1 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={13}
                fill="none"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-[#878787]">
                {t("sectionThree.bulletThree")}
              </span>
            </div>
          </div>

          <Image
            src={timetracker}
            height={400}
            className="-mb-[32px] md:-mb-[1px] object-contain mt-8 md:mt-0"
            quality={100}
            alt="Tracker"
          />
        </div>
      </div>
    </section>
  );
}
