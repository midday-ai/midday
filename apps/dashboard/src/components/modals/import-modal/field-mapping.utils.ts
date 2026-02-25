import { mappableFields } from "./context";

export function isActiveRequest(
  requestId: number,
  activeRequestRef: { current: number },
) {
  return requestId === activeRequestRef.current;
}

export function shouldApplyMappedColumn(
  field: string,
  value: unknown,
  fileColumns: string[],
): field is keyof typeof mappableFields {
  return (
    Object.keys(mappableFields).includes(field) &&
    typeof value === "string" &&
    fileColumns.includes(value)
  );
}
