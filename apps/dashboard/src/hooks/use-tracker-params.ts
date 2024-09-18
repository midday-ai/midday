import { formatISO } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";

export function useTrackerParams(initialDate?: string) {
  const [params, setParams] = useQueryStates(
    {
      date: parseAsString.withDefault(
        initialDate ?? formatISO(new Date(), { representation: "date" }),
      ),
      create: parseAsString,
      projectId: parseAsString,
      update: parseAsString,
      day: parseAsString,
    },
    { shallow: false },
  );

  return {
    ...params,
    setParams,
  };
}
