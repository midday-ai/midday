"use client";

import { TextGenerateEffect } from "@/components/text-generate-effect";
import { useI18n } from "@/locales/client";

export function SectionSeven() {
  const t = useI18n();

  return (
    <TextGenerateEffect
      className="md:pt-28 pt-12 pb-12 md:pb-32 text-4xl	md:text-6xl max-w-[1370px] container md:leading-[85px] mb-12"
      words={t("sectionSeven.description")}
    />
  );
}
