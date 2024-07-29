"use client";

import { useI18n } from "@/locales/client";
import Image from "next/image";
import exporting from "public/exporting.png";
import vault from "public/vault.png";

export function SectionFive() {
  const t = useI18n();

  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12">
      <div className="border border-border lg:basis-2/3 bg-[#121212] p-10 flex justify-between lg:space-x-8 lg:flex-row flex-col-reverse items-center lg:items-start">
        <Image
          src={vault}
          quality={100}
          alt="Vault"
          className="mt-8 lg:mt-0 basis-1/2 object-contain md:max-w-[367px] border-l-[1px] border-border"
        />

        <div className="flex flex-col basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Vault</h4>

          <p className="text-[#878787] mb-4 text-sm">
            {t("sectionFive.description")}
          </p>

          <p className="text-[#878787] text-sm">
            {t("sectionFive.descriptionTwo")}
          </p>
        </div>
      </div>

      <div className="border border-border basis-1/3 bg-[#121212] p-10 md:text-center flex flex-col">
        <h4 className="font-medium text-xl md:text-2xl mb-4">
          {t("sectionFive.titleTwo")}
        </h4>
        <p className="text-[#878787] text-sm">
          {t("sectionFive.descriptionThree")}
        </p>

        <Image
          src={exporting}
          quality={100}
          alt="Export"
          className="md:mt-auto mt-10"
        />
      </div>
    </section>
  );
}
