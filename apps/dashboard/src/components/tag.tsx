"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/utils";

type Props = {
  type: "pending";
};

export function Tag({ type }: Props) {
  const t = useI18n();
  return (
    <div
      className={cn(
        "py-1 px-2 text-xs font-medium rounded-md",
        "bg-[#1D1D1D] text-[#878787]"
      )}
    >
      {t(`tags.${type}`)}
    </div>
  );
}
