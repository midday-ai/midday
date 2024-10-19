import { EmptyState } from "@/components/charts/empty-state";
import { UserTier } from "@midday/supabase/types";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";

interface AccountSummarySectionProps extends React.HTMLAttributes<HTMLDivElement> {
  user: any;
  isEmpty: boolean;
  tier: UserTier;
  name: string;
  description?: string;
  detailedDescription?: string;
  className?: string;
};

export function AccountSummarySection({
  user,
  isEmpty,
  tier,
  name,
  description,
  detailedDescription,
  className,
}: AccountSummarySectionProps) {
  const isCurrentUserTierFree = tier === "free";

  if (isCurrentUserTierFree) {
    return (
      <Card className={cn("rounded-2xl w-full", className)}>
        <div className="mx-auto w-full p-[2%]">
          <div className="mx-auto max-w-7xl lg:mx-0">
            <div className="flex flex-row justify-between">
              <p className="text-lg font-bold leading-7 text-blue-800 md:pt-[10%]">
                Solomon AI
              </p>
            </div>

            <h2 className="mt-2 text-6xl font-bold tracking-tight text-foreground sm:text-5xl">
              {description ?? `Cash flow analysis for your business, ${name}`}
            </h2>
            <p className="mt-6 text-xl leading-8 text-foreground/3">
              {detailedDescription ??
                "Your Dynamic Dashboard for Cash Flow Optimization and Financial Stability"}
            </p>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <div className={cn(isEmpty && "relative")}>
      {isEmpty && <EmptyState />}
      <div className={cn("py-[2%]", isEmpty && "blur-[8px] opacity-20")}>
        <ConnectedAccountSummary
          name={user?.data?.full_name ?? "Solomon AI User"}
        />
      </div>
    </div>
  );
}
