import { BotCard } from "@/components/chat/messages";
import { addMonths, format } from "date-fns";

type Props = {
  months: number;
};

export function RunwayUI({ months }: Props) {
  return (
    <BotCard>
      Based on your historical data, your expected runway is {months} months,
      ending in {format(addMonths(new Date(), months), "MMMM Y")}.
    </BotCard>
  );
}
