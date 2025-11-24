import { formatISO, subMonths, subYears } from "date-fns";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";

const getDefaultDateRange = () => {
  const now = new Date();
  const from = subYears(now, 1);
  return {
    from: formatISO(from, { representation: "date" }),
    to: formatISO(now, { representation: "date" }),
  };
};

export const metricsParamsSchema = {
  from: parseAsString.withDefault(getDefaultDateRange().from),
  to: parseAsString.withDefault(getDefaultDateRange().to),
};

export function useMetricsParams() {
  const [params, setParams] = useQueryStates(metricsParamsSchema, {
    clearOnDefault: true,
  });

  // Map kebab-case URL params to camelCase for easier usage
  return {
    from: params.from,
    to: params.to,
    setParams: (updates: {
      from?: string;
      to?: string;
    }) => {
      const mappedUpdates: Record<string, string | null> = {};
      if (updates.from !== undefined) {
        mappedUpdates.from = updates.from;
      }
      if (updates.to !== undefined) {
        mappedUpdates.to = updates.to;
      }
      setParams(mappedUpdates);
    },
  };
}
