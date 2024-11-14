"use client";

import { BotCard } from "@/components/chat/messages";
import { CopyInput } from "@/components/copy-input";
import { useI18n } from "@/locales/client";
import { useUserContext } from "@/store/user/hook";
import { formatDate } from "@/utils/format";

type Props = {
  shortLink: string;
  type: "burn_rate" | "profit" | "revenue";
  startDate: string;
  endDate: string;
};

export function ReportUI({ shortLink, type, startDate, endDate }: Props) {
  const { date_format: dateFormat } = useUserContext((state) => state.data);
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
        {formatDate(startDate, dateFormat)} and{" "}
        {formatDate(endDate, dateFormat)}
      </p>

      <div className="flex">
        <CopyInput value={shortLink} className="w-auto" />
      </div>
    </BotCard>
  );
}
