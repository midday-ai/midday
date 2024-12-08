export type AccountType =
  | "depository"
  | "credit"
  | "other_asset"
  | "loan"
  | "other_liability";

export function getType(type: string): AccountType {
  switch (type) {
    case "BANK":
    case "depository":
      return "depository";
    case "CREDIT":
    case "credit":
      return "credit";
    default:
      return "other_asset";
  }
}
