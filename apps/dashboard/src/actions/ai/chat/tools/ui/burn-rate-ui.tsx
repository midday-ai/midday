import { AreaChart } from "@/components/charts/area-chart";
import { BotCard } from "@/components/chat/messages";
import { FormatAmount } from "@/components/format-amount";
import { addMonths, format } from "date-fns";

type Props = {
  avarageBurnRate: number;
  currency: string;
  data: any;
  months: number;
};

export function BurnRateUI({ avarageBurnRate, currency, months, data }: Props) {
  return (
    <BotCard className="font-sans space-y-4">
      <p className="font-mono">
        Based on your historical data, your avarage burn rate is{" "}
        <FormatAmount amount={avarageBurnRate} currency={currency} /> per month.
        Your expected runway is {months} months, ending in{" "}
        {format(addMonths(new Date(), months), "MMMM Y")}.
      </p>

      <AreaChart currency={currency} data={data} height={200} />
    </BotCard>
  );
}
