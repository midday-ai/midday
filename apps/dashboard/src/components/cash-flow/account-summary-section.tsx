import { EmptyState } from "@/components/charts/empty-state";
import { cn } from "@midday/ui/cn";
import { ConnectedAccountSummary } from "@midday/ui/portal/connected-account-view";

type AccountSummarySectionProps = {
  user: any;
  isEmpty: boolean;
};

export function AccountSummarySection({ user, isEmpty }: AccountSummarySectionProps) {
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