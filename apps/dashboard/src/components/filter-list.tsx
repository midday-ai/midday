import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { format } from "date-fns";

export function FilterList({
  filters,
  loading,
  onRemove,
}: { filters: any; loading: boolean; onRemove: (key: string) => void }) {
  if (loading) {
    return (
      <div className="flex space-x-2">
        <Skeleton className="rounded-full h-8 w-[100px]" />
        <Skeleton className="rounded-full h-8 w-[100px]" />
      </div>
    );
  }

  const renderFilter = ({ key, value }) => {
    switch (key) {
      case "start": {
        if (key === "start" && value && filters.end) {
          return `${format(new Date(value), "MMM d, yyyy")} - ${format(
            new Date(filters.end),
            "MMM d, yyyy",
          )}`;
        }

        return (
          key === "start" && value && format(new Date(value), "MMM d, yyyy")
        );
      }
      case "attachments": {
        if (value === "exclude") {
          return "Without reciepts";
        }
        return "With reciepts";
      }
      default:
        return null;
    }
  };

  const handleOnRemove = (key: string) => {
    if (key === "start" || key === "end") {
      onRemove({ start: null, end: null });
      return;
    }

    onRemove({ [key]: null });
  };

  return (
    <div className="flex space-x-2">
      {Object.entries(filters)
        .filter(
          ([key, value]) => value !== null && key !== "end" && key !== "q",
        )
        .map(([key, value]) => {
          return (
            <Button
              key={key}
              className="rounded-full h-8 bg-secondary hover:bg-secondary font-normal text-[#878787] flex space-x-1 items-center group"
              onClick={() => handleOnRemove(key)}
            >
              <Icons.Clear className="scale-0 group-hover:scale-100 transition-all w-0 group-hover:w-4" />
              <span>
                {renderFilter({
                  key,
                  value,
                })}
              </span>
            </Button>
          );
        })}
    </div>
  );
}
