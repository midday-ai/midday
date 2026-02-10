import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useTRPC } from "@/trpc/client";

type UseBillableHoursParams = {
  date: Date | string;
  view: "week" | "month";
  weekStartsOnMonday?: boolean;
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
};

/**
 * Single source of truth for billable hours calculations.
 * All date range logic with 1-day buffer handled on backend.
 */
export function useBillableHours(params: UseBillableHoursParams) {
  const {
    date,
    view,
    weekStartsOnMonday = false,
    enabled = true,
    refetchInterval,
    refetchOnWindowFocus,
  } = params;
  const trpc = useTRPC();

  // Convert date to ISO string format (YYYY-MM-DD)
  const dateString =
    typeof date === "string"
      ? date
      : formatISO(date, { representation: "date" });

  return useQuery({
    ...trpc.widgets.getBillableHours.queryOptions({
      date: dateString,
      view,
      weekStartsOnMonday,
    }),
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
  });
}
