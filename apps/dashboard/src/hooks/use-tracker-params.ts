import { formatISO } from "date-fns";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryStates,
} from "nuqs";

export function useTrackerParams(initialDate?: string) {
  const [params, setParams] = useQueryStates({
    date: parseAsString.withDefault(
      initialDate ?? formatISO(new Date(), { representation: "date" }),
    ),
    create: parseAsString,
    projectId: parseAsString,
    update: parseAsBoolean,
    selectedDate: parseAsString,
    range: parseAsArrayOf(parseAsString),
  });

  return {
    ...params,
    setParams,
  };
}
