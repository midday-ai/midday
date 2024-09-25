import { EmptyState } from "@/components/charts/empty-state";
import { UserTier } from "@midday/supabase/types";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";

type AccountSummarySectionProps = {
  user: any;
  isEmpty: boolean;
  tier: UserTier;
  name: string;
};

export function AccountSummarySection({
  user,
  isEmpty,
  tier,
  name,
}: AccountSummarySectionProps) {
  const isCurrentUserTierFree = tier === "free";

  if (isCurrentUserTierFree) {
    return (
      <Card className="rounded-2xl w-full">
        <div className="mx-auto w-full p-[3%]">
          <div className="mx-auto max-w-7xl lg:mx-0">
            <div className="flex flex-row justify-between">
              <p className="text-base font-bold leading-7 text-blue-800 md:pt-[10%]">
                Solomon AI
              </p>
            </div>

            <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Cash flow analysis for your business, {name}
            </h2>
            <p className="mt-6 text-lg leading-8 text-foreground/3">
              Your Dynamic Dashboard for Cash Flow Optimization and Financial
              Stability
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
