"use client";

import { BotCard } from "@/components/chat/messages";
import { CopyInput } from "@/components/copy-input";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { formatDate } from "@/utils/format";

type Props = {
  shortLink: string;
  type: "burn_rate" | "profit" | "revenue";
  startDate: string;
  endDate: string;
};

export function ReportUI({ shortLink, type, startDate, endDate }: Props) {
  const { data: user } = useUserQuery();
  const t = useI18n();

  if (!shortLink) {
    return (
      <BotCard>We couldn't create a report for you, please try again.</BotCard>
    );
  }

  return (
    <BotCard className="font-sans space-y-4">
      <p className="font-mono">
        Here is your report for {t(`chart_type.${type}`)} between{" "}
        {formatDate(startDate, user?.date_format)} and{" "}
        {formatDate(endDate, user?.date_format)}
      </p>

      <div className="flex">
        <CopyInput value={shortLink} className="w-auto" />
      </div>
    </BotCard>
  );
}
