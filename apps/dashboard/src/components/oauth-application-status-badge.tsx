import { cn } from "@midday/ui/cn";

type OAuthApplicationStatus =
  | "approved"
  | "rejected"
  | "pending"
  | "draft"
  | null;

type Props = {
  status: OAuthApplicationStatus;
  className?: string;
};

export function OAuthApplicationStatusBadge({ status, className }: Props) {
  const getStatusColor = (status: OAuthApplicationStatus) => {
    switch (status) {
      case "approved":
        return "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10";
      case "rejected":
        return "text-[#FF3638] bg-[#FF3638]/10";
      case "pending":
        return "text-[#FFD02B] bg-[#FFD02B]/10";
      case "draft":
        return "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]";
      default:
        return "text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D]";
    }
  };

  return (
    <div
      className={cn(
        "text-[10px] px-3 py-1 rounded-full capitalize",
        getStatusColor(status),
        className,
      )}
    >
      {status === "pending" ? "Reviewing" : status}
    </div>
  );
}
