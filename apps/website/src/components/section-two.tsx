"use client";

import { useI18n } from "@/locales/client";
import Image from "next/image";
import computer from "public/computer.png";

export function SectionTwo() {
  const t = useI18n();

  return (
    <section className="border border-border container bg-[#121212] md:pb-0 overflow-hidden mb-12">
      <div className="flex flex-col md:space-x-12 md:flex-row">
        <Image
          src={computer}
          height={446}
          width={836}
          className="-mb-[1px] object-contain"
          alt="Overview"
          quality={100}
        />

        <div className="mt-6 md:max-w-[40%] md:ml-8 md:mb-8 flex flex-col justify-center p-8 md:p-0">
          <h3 className="font-medium text-xl md:text-2xl mb-4">
            {t("sectionTwo.title")}
          </h3>

          <p className="text-[#878787] mb-4 text-sm">
            {t("sectionTwo.description")}
          </p>

          <div className="flex flex-col space-y-2 mt-8">
            <div className="flex space-x-2 items-center">
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
              <span className="text-[#878787] text-sm">
                {t("sectionTwo.bulletOne")}
              </span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-[#878787] text-sm">
                {t("sectionTwo.bulletTwo")}
              </span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-[#878787] text-sm">
                {t("sectionTwo.bulletThree")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
