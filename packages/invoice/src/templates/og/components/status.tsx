export function Status({
  status,
}: {
  status: "draft" | "overdue" | "paid" | "unpaid" | "canceled";
}) {
  const getStatusStyles = () => {
    if (status === "draft" || status === "canceled") {
      return "text-[#878787] bg-[#1D1D1D] text-[20px]";
    }

    if (status === "overdue") {
      return "bg-[#262111] text-[#FFD02B]";
    }

    if (status === "paid") {
      return "text-[#00C969] bg-[#17241B]";
    }

    return "text-[#1D1D1D] bg-[#29292]";
  };

  return (
    <div
      tw={`flex px-4 py-1 rounded-full font-mono inline-flex max-w-full text-[22px] ${getStatusStyles()}`}
    >
      <span tw="line-clamp-1 truncate inline-block font-[GeistMono]">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
