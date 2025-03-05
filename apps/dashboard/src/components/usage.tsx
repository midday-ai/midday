import { getPlanLimits } from "@/utils/plans";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";

interface UsageItemProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  period?: string;
}

function CircularProgress({ value }: { value: number }) {
  return (
    <div className="relative h-6 w-6 flex items-center justify-center">
      <svg className="h-6 w-6" viewBox="0 0 36 36">
        {/* Background circle */}
        <circle
          className="stroke-muted fill-none"
          cx="18"
          cy="18"
          r="16"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          className="stroke-primary fill-none"
          cx="18"
          cy="18"
          r="16"
          strokeWidth="4"
          strokeDasharray={`${value * 0.01 * 100.53} 100.53`}
          strokeDashoffset="0"
          transform="rotate(-90 18 18)"
        />
      </svg>
    </div>
  );
}

function UsageItem({ label, current, max, unit, period }: UsageItemProps) {
  const percentage = (current / max) * 100;

  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-4">
        <CircularProgress value={percentage} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        {current}/{max} {unit} {period && <span>per {period}</span>}
      </div>
    </div>
  );
}

export function Usage({
  data,
  plan,
}: {
  plan: string;
  data: {
    total_document_size: number;
    number_of_users: number;
    number_of_bank_connections: number;
    inbox_created_this_month: number;
    invoices_created_this_month: number;
  };
}) {
  // Convert bytes to GB
  const storageInGB = Math.round(data.total_document_size / 1024 / 1024 / 1024);

  return (
    <div>
      <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
        Usage
      </h2>

      <Card className="divide-y">
        <UsageItem
          label="Users"
          current={data.number_of_users}
          max={getPlanLimits(plan).users}
        />
        <UsageItem
          label="Bank connections"
          current={data.number_of_bank_connections}
          max={getPlanLimits(plan).bankConnections}
        />
        <UsageItem
          label="Storage"
          current={storageInGB}
          max={getPlanLimits(plan).storage}
          unit="GB"
        />
        <UsageItem
          label="Inbox"
          current={data.inbox_created_this_month}
          max={getPlanLimits(plan).inbox}
          period="month"
        />
        <UsageItem
          label="Invoices"
          current={data.invoices_created_this_month}
          max={getPlanLimits(plan).invoices}
          period="month"
        />
      </Card>
    </div>
  );
}

export function UsageSkeleton() {
  // Define labels to use for keys instead of array indices
  const skeletonItems = [
    "users",
    "connections",
    "storage",
    "inbox",
    "invoices",
  ];

  return (
    <div>
      <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
        Usage
      </h2>

      <Card className="divide-y">
        {skeletonItems.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between py-3 px-4"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
