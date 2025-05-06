import { useQueryStates } from "nuqs";
import { parseAsString, parseAsStringLiteral } from "nuqs/server";

export function useDocumentParams() {
  const [params, setParams] = useQueryStates({
    id: parseAsString,
    filePath: parseAsString,
    view: parseAsStringLiteral(["grid", "list"]).withDefault("grid"),
  });

  return {
    params,
    setParams,
  };
}
