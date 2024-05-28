import { FormatAmount } from "@/components/format-amount";
import { format } from "date-fns";

type Props = {
  avarageBurnRate: number;
  currency: string;
  startDate?: string;
  endDate?: string;
};

export function BurnRateUI({
  avarageBurnRate,
  currency,
  startDate,
  endDate,
}: Props) {
  return (
    <div>
      Your avarage burn rate is{" "}
      <FormatAmount amount={avarageBurnRate} currency={currency} /> between{" "}
      {startDate && format(new Date(startDate), "LLL dd, y")} and{" "}
      {endDate && format(new Date(endDate), "LLL dd, y")}
    </div>
  );
}
