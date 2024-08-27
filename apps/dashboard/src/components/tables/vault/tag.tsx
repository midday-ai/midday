"use client";

import { useI18n } from "@/locales/client";

export function Tag({ name }: { name: string }) {
  const t = useI18n();

  if (!name) {
    return null;
  }

  return (
    <div className="p-1 text-[#878787] bg-[#F2F1EF] text-xs dark:bg-[#1D1D1D] px-3 py-1.5 rounded-full cursor-default font-mono inline-block">
      {t(`tags.${name}`)}
    </div>
  );
}
