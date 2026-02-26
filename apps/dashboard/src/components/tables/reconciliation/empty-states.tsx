import { Icons } from "@midday/ui/icons";

export function NoReconciliationData() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icons.Transactions size={24} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No transactions to reconcile</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[360px]">
        Bank transactions will appear here once they are synced. Connect a bank
        account and sync transactions to get started.
      </p>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icons.Search size={24} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No results found</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[360px]">
        Try adjusting your filters or search query to find what you are looking
        for.
      </p>
    </div>
  );
}

export function AllCaughtUp() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-4xl">&#127881;</div>
      <h3 className="text-lg font-medium">All caught up!</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-[360px]">
        No discrepancies to review. All transactions have been reconciled.
      </p>
    </div>
  );
}
