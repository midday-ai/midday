import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";

export function useDocumentParams() {
  const [params, setParams] = useQueryStates({
    id: parseAsString,
    filePath: parseAsString,
  });

  return {
    params,
    setParams,
  };
}
