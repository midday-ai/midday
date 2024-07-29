"use client";

import { useI18n } from "@/locales/client";

export function SectionOne() {
  const t = useI18n();

  return (
    <section className="mt-24 md:mt-[200px] mb-12">
      <h3 className="text-4xl md:text-8xl font-medium">
        {t("sectionOne.title")}
      </h3>
      <p className="mt-4 md:mt-8 text-[#878787]">
        {t("sectionOne.description")}
      </p>
    </section>
  );
}
