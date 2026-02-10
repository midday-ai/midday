"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
import { AnimatedNumber } from "./animated-number";
import { FormatAmount } from "./format-amount";

type Props = {
  data: RouterOutputs["invoice"]["invoiceSummary"];
  title: string;
};

export function InvoiceSummarySkeleton() {
  return (
    <Card className="hidden sm:block">
      <CardHeader className="pb-2 flex flex-row items-center">
        <CardTitle className="font-medium text-2xl font-serif">
          <Skeleton className="h-[32px] w-32" />
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-[26px] w-16" />
          <Skeleton className="h-[22px] w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function InvoiceSummary({ data, title }: Props) {
  const t = useI18n();
  const { data: team } = useTeamQuery();

  if (!data) {
    return null;
  }

  const hasMultipleCurrencies = data.breakdown && data.breakdown.length > 1;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center">
        <CardTitle className="font-medium text-2xl font-serif">
          <AnimatedNumber
            key={data.currency}
            value={data.totalAmount}
            currency={data.currency ?? team?.baseCurrency ?? "USD"}
            maximumFractionDigits={0}
            minimumFractionDigits={0}
          />
        </CardTitle>
        {hasMultipleCurrencies && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2 text-xs text-muted-foreground">
                  <Icons.InfoOutline className="size-3.5 mb-1" />
                </span>
              </TooltipTrigger>
              <TooltipContent
                className="text-xs text-[#878787] max-w-[240px] p-4 space-y-2"
                side="bottom"
                sideOffset={10}
              >
                <h3 className="font-medium text-primary">Currency Breakdown</h3>
                <div className="space-y-1.5">
                  {data.breakdown?.map((item, index) => (
                    <div key={item.currency}>
                      <div className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.currency}</span>
                          <span className="text-[#878787]">({item.count})</span>
                        </div>
                        <div className="text-right">
                          <FormatAmount
                            amount={item.originalAmount}
                            currency={item.currency}
                            maximumFractionDigits={0}
                            minimumFractionDigits={0}
                          />
                          {item.currency !== data.currency && (
                            <div className="text-[#878787] text-xs mt-1">
                              ≈{" "}
                              <FormatAmount
                                amount={item.convertedAmount}
                                currency={data.currency}
                                maximumFractionDigits={0}
                                minimumFractionDigits={0}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      {index < (data.breakdown?.length ?? 0) - 1 && (
                        <div className="border-t border-border mt-2" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#878787]">
                  All amounts are converted into your base currency.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex flex-col gap-2">
          <div>{title}</div>
          <div className="text-sm text-muted-foreground">
            {t("invoice_count", {
              count: data.invoiceCount ?? 0,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
