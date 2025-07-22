import { cn } from "@midday/ui/cn";

interface OAuthApplicationStatusBadgeProps {
  status: string;
  className?: string;
}

export function OAuthApplicationStatusBadge({
  status,
  className,
}: OAuthApplicationStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "dark:bg-green-900 dark:text-green-300 text-green-600 bg-green-100";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "draft":
        return "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]";
      default:
        return "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]";
    }
  };

  return (
    <div
      className={cn(
        "text-[10px] px-3 py-1 rounded-full font-mono capitalize",
        getStatusColor(status),
        className,
      )}
    >
      {status === "pending" ? "Reviewing" : status}
    </div>
  );
}
