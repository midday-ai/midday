import { formatISO } from "date-fns";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

type Props = {
  defaultView?: "week" | "month";
  initialDate?: string;
};

export function useTrackerParams({ defaultView, initialDate }: Props = {}) {
  const [params, setParams] = useQueryStates({
    date: parseAsString.withDefault(
      initialDate ?? formatISO(new Date(), { representation: "date" }),
    ),
    create: parseAsBoolean,
    projectId: parseAsString,
    update: parseAsBoolean,
    selectedDate: parseAsString,
    range: parseAsArrayOf(parseAsString),
    statuses: parseAsArrayOf(
      parseAsStringLiteral(["completed", "in_progress"]),
    ),
    start: parseAsString,
    end: parseAsString,
    view: parseAsStringLiteral(["week", "month"]).withDefault(
      defaultView ?? "month",
    ),
  });

  return {
    ...params,
    setParams,
  };
}
