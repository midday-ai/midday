"use client";

import { useI18n } from "@/locales/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";

type Props = {
  status: NonNullable<RouterOutputs["trackerProjects"]["getById"]>["status"];
};

export function TrackerStatus({ status }: Props) {
  const t = useI18n();

  return (
    <div className="flex items-center space-x-4">
      <div
        className={cn(
          "w-[6px] h-[6px] rounded-full bg-[#FFD02B]",
          status === "completed" && "bg-primary",
        )}
      />
      {/* @ts-expect-error */}
      <span>{t(`tracker_status.${status}`)}</span>
    </div>
  );
}
