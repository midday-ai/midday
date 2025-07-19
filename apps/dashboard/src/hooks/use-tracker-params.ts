import { formatISO } from "date-fns";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

type Props = {
  initialDate?: string;
};

export function useTrackerParams({ initialDate }: Props = {}) {
  const [params, setParams] = useQueryStates({
    date: parseAsString.withDefault(
      initialDate ?? formatISO(new Date(), { representation: "date" }),
    ),
    create: parseAsBoolean,
    projectId: parseAsString,
    update: parseAsBoolean,
    selectedDate: parseAsString,
    eventId: parseAsString,
    range: parseAsArrayOf(parseAsString),
    statuses: parseAsArrayOf(
      parseAsStringLiteral(["completed", "in_progress"]),
    ),
    start: parseAsString,
    end: parseAsString,
    view: parseAsStringLiteral(["week", "month"]),
  });

  return {
    ...params,
    setParams,
  };
}
