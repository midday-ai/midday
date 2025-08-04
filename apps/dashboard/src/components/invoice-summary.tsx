"use client";

import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { useState } from "react";
import { AnimatedNumber } from "./animated-number";

type Props = {
  data: RouterOutputs["invoice"]["invoiceSummary"];
  totalInvoiceCount: number;
  title: string;
};

export function InvoiceSummarySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>
          <Skeleton className="h-[30px] w-32" />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-[34px]">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoiceSummary({ data, totalInvoiceCount, title }: Props) {
  const t = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: team } = useTeamQuery();

  const dataWithDefaultCurrency = data?.length
    ? data
    : [{ currency: team?.baseCurrency, totalAmount: 0 }];

  const item = dataWithDefaultCurrency[activeIndex];

  if (!item) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2 relative">
        <CardTitle className="font-mono font-medium text-2xl">
          <AnimatedNumber
            key={item.currency}
            value={item.totalAmount}
            currency={item.currency ?? team?.baseCurrency ?? "USD"}
            maximumFractionDigits={0}
            minimumFractionDigits={0}
          />

          {dataWithDefaultCurrency.length > 1 && (
            <div className="flex space-x-2 top-[63px] absolute">
              {dataWithDefaultCurrency.map((item, idx) => (
                <div
                  key={item.currency}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "w-[10px] h-[3px] bg-[#1D1D1D] dark:bg-[#D9D9D9] opacity-30 transition-all",
                    idx === activeIndex && "opacity-100",
                  )}
                />
              ))}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div>{title}</div>
          <div className="text-sm text-muted-foreground">
            {t("invoice_count", {
              count: totalInvoiceCount ?? 0,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
