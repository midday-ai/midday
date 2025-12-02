import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const inboxParamsSchema = {
  inboxId: parseAsString,
  type: parseAsStringLiteral(["list", "details"]),
  order: parseAsStringLiteral(["asc", "desc"]).withDefault("asc"),
  sort: parseAsStringLiteral([
    "date",
    "alphabetical",
    "document_date",
  ]).withDefault("date"),
  connected: parseAsBoolean,
};

export function useInboxParams() {
  const [params, setParams] = useQueryStates(inboxParamsSchema);

  return {
    params,
    setParams,
  };
}

export const loadInboxParams = createLoader(inboxParamsSchema);
