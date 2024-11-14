"use client";

import { useI18n } from "@/locales/client";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { useState } from "react";
import { AnimatedNumber } from "./animated-number";

type Props = {
  data: any[];
  totalInvoiceCount: number;
  defaultCurrency: string;
  title: string;
  locale: string;
};

export function InvoiceSummarySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <Skeleton className="h-8 w-32" />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoiceSummary({
  data,
  totalInvoiceCount,
  defaultCurrency,
  title,
}: Props) {
  const t = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);

  const dataWithDefaultCurrency = data.length
    ? data
    : [{ currency: defaultCurrency, total_amount: 0 }];

  const item = dataWithDefaultCurrency[activeIndex];

  return (
    <Card>
      <CardHeader className="pb-2 relative">
        <CardTitle className="font-mono font-medium text-2xl">
          <AnimatedNumber
            key={item.currency}
            value={item.total_amount}
            currency={item.currency}
            maximumFractionDigits={0}
            minimumFractionDigits={0}
          />

          {dataWithDefaultCurrency.length > 1 && (
            <div className="flex space-x-2 top-[63px] absolute">
              {dataWithDefaultCurrency.map((item, idx) => (
                <button
                  type="button"
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
