"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@absplatform/ui/cn";

export function TrackerStatus({ status }) {
  const t = useI18n();

  return (
    <div className="flex items-center space-x-4">
      <div
        className={cn(
          "w-[6px] h-[6px] rounded-full bg-[#FFD02B]",
          status === "completed" && "bg-primary",
        )}
      />
      <span>{t(`tracker_status.${status}`)}</span>
    </div>
  );
}
