"use client";

import { BotCard, BotMessage } from "@/components/chat/messages";

type Props = {
  content: string;
};

export function ForecastUI({ content }: Props) {
  if (!content) {
    return (
      <BotCard>
        We couldn't find any historical data to provide you with a forecast.
      </BotCard>
    );
  }

  return <BotMessage content={content} />;
}
