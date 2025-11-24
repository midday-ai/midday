import { useQueryStates } from "nuqs";
import { parseAsStringLiteral } from "nuqs/server";

export const metricsParamsSchema = {
  "revenue-type": parseAsStringLiteral(["net", "gross"] as const).withDefault(
    "net",
  ),
  "year-type": parseAsStringLiteral(["fiscal", "real"] as const).withDefault(
    "real",
  ),
  "time-period": parseAsStringLiteral([
    "3 months",
    "6 months",
    "1 year",
    "2 years",
    "5 years",
  ] as const).withDefault("1 year"),
};

export function useMetricsParams() {
  const [params, setParams] = useQueryStates(metricsParamsSchema, {
    clearOnDefault: true,
  });

  // Map kebab-case URL params to camelCase for easier usage
  return {
    revenueType: params["revenue-type"],
    yearType: params["year-type"],
    timePeriod: params["time-period"],
    setParams: (updates: {
      revenueType?: "net" | "gross";
      yearType?: "fiscal" | "real";
      timePeriod?: "3 months" | "6 months" | "1 year" | "2 years" | "5 years";
    }) => {
      const mappedUpdates: Record<string, string | null> = {};
      if (updates.revenueType !== undefined) {
        mappedUpdates["revenue-type"] = updates.revenueType;
      }
      if (updates.yearType !== undefined) {
        mappedUpdates["year-type"] = updates.yearType;
      }
      if (updates.timePeriod !== undefined) {
        mappedUpdates["time-period"] = updates.timePeriod;
      }
      setParams(mappedUpdates);
    },
  };
}
