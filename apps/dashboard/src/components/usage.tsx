import { Card } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { getPlanLimits } from "@/utils/plans";

interface UsageItemProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
  period?: string;
  percentage?: number;
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

// Helper function to format file size
function _formatFileSize(bytes: number): { value: number; unit: string } {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) {
    return { value: bytes / GB, unit: "GB" };
  }

  if (bytes >= MB) {
    return { value: bytes / MB, unit: "MB" };
  }

  return { value: Math.max(bytes / KB, 0.1), unit: "KB" };
}

function UsageItem({
  label,
  current,
  max,
  unit,
  period,
  percentage,
}: UsageItemProps) {
  // Calculate percentage if not explicitly provided
  const calculatedPercentage =
    percentage !== undefined
      ? percentage
      : Math.min((current / max) * 100, 100);

  // Format values differently based on whether we have a unit or not
  let formattedCurrent: string;
  let formattedMax: string;

  if (unit) {
    // For values with units (like GB), show the decimal value
    formattedCurrent = current.toFixed(1).replace(/\.0$/, "");
    formattedMax = max.toFixed(1).replace(/\.0$/, "");
  } else {
    // For counts without units, use k formatting for large numbers
    formattedCurrent =
      current >= 1000 ? `${(current / 1000).toFixed(1)}k` : current.toString();

    formattedMax = max >= 1000 ? `${(max / 1000).toFixed(1)}k` : max.toString();
  }

  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-4">
        <CircularProgress value={calculatedPercentage} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        {formattedCurrent}/{formattedMax} {unit}{" "}
        {period && <span>per {period}</span>}
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
  const GB = 1024 * 1024 * 1024;

  const selectedPlan = getPlanLimits(plan);

  // Always convert to GB regardless of size
  const _storageInGB = data?.total_document_size ?? 0 / GB;
  const _maxStorageInGB = selectedPlan?.storage ?? 0 / GB;

  return (
    <div>
      <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
        Usage
      </h2>

      <Card className="divide-y">
        <UsageItem
          label="Users"
          current={data?.number_of_users ?? 0}
          max={selectedPlan?.users}
        />
        <UsageItem
          label="Bank connections"
          current={data?.number_of_bank_connections ?? 0}
          max={selectedPlan?.bankConnections}
        />
        {/* <UsageItem
          label="Storage"
          current={storageInGB}
          max={selectedPlan?.storage}
          unit="GB"
          percentage={Math.min(
            (data?.total_document_size ?? 0 / selectedPlan?.storage) * 100,
            100,
          )}
        /> */}
        <UsageItem
          label="Inbox"
          current={data?.inbox_created_this_month ?? 0}
          max={selectedPlan.inbox}
          period="month"
        />
        <UsageItem
          label="Invoices"
          current={data?.invoices_created_this_month ?? 0}
          max={selectedPlan.invoices}
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
    // "storage",
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
