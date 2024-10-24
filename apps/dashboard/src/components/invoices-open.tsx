import { getI18n } from "@/locales/server";
import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import Link from "next/link";
import { AnimatedNumber } from "./animated-number";

export function InvoicesOpenSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <Skeleton className="h-8 w-32" />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export async function InvoicesOpen({
  defaultCurrency,
}: {
  defaultCurrency: string;
}) {
  const { data } = await getInvoiceSummary();
  const t = await getI18n();

  return (
    <Link href="/invoices?statuses=draft,overdue,unpaid">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono font-medium text-2xl">
            <AnimatedNumber
              value={data?.total_amount ?? 0}
              currency={data?.currency ?? defaultCurrency}
              maximumFractionDigits={0}
              minimumFractionDigits={0}
            />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <span>Total open</span>
                    <Icons.Info className="h-4 w-4 text-sm text-[#606060]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  className="text-xs text-[#878787] p-1"
                  side="bottom"
                  sideOffset={10}
                >
                  Open includes all invoices that are not paid or canceled.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="text-sm text-muted-foreground">
              {t("invoice_count", {
                count: data?.invoice_count ?? 0,
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
