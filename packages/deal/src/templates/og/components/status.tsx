export function Status({
  status,
}: {
  status:
    | "draft"
    | "overdue"
    | "paid"
    | "unpaid"
    | "canceled"
    | "scheduled"
    | "refunded";
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

    if (status === "scheduled") {
      return "text-[#1F6FEB] bg-[#DDEBFF]";
    }

    if (status === "refunded") {
      return "text-[#F97316] bg-[#3D2612]";
    }

    return "text-[#F5F5F3] bg-[#292928]";
  };

  return (
    <div
      tw={`flex px-4 py-1 rounded-full max-w-full text-[22px] ${getStatusStyles()}`}
      style={{ fontFamily: "hedvig-sans" }}
    >
      <span style={{ fontFamily: "hedvig-sans" }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
