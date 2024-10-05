export type AccountType =
  | "depository"
  | "credit"
  | "other_asset"
  | "loan"
  | "other_liability";

export function getType(type: string): AccountType {
  switch (type.toLowerCase()) {
    case "depository":
    case "stripe":
      return "depository";
    case "credit":
      return "credit";
    case "loan":
      return "loan";
    case "other_liability":
      return "other_liability";
    default:
      return "other_asset";
  }
}

export function getStripeAccountType(account: { type: string }): AccountType {
  switch (account.type) {
    case "standard":
    case "express":
    case "custom":
      return "depository";
    default:
      return "other_asset";
  }
}
