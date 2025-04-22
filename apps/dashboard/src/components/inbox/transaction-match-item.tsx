"use client";

import { formatDate } from "@/utils/format";
import { Badge } from "@midday/ui/badge";
import { FormatAmount } from "../format-amount";

type Props = {
  date: string;
  name: string;
  dateFormat?: string | null;
  amount: number;
  currency: string;
  showBestMatch?: boolean;
};

export function TransactionMatchItem({
  date,
  name,
  dateFormat,
  amount,
  currency,
  showBestMatch = false,
}: Props) {
  return (
    <div className="flex w-full items-center justify-between gap-2 text-sm">
      <div className="flex gap-2 items-center">
        <span className="truncate">{name}</span>
        <span className="text-muted-foreground">
          {formatDate(date, dateFormat, true)}
        </span>
      </div>

      <div className="flex flex-shrink-0 items-center gap-4">
        {showBestMatch && (
          <Badge variant="outline" className="px-2 py-0">
            Best Match
          </Badge>
        )}
        <FormatAmount amount={amount} currency={currency} />
      </div>
    </div>
  );
}
