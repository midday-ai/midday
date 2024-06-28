export enum AccountType {
  DEPOSITORY = "depository",
  CREDIT = "credit",
  OTHER_ASSET = "other_asset",
  LOAN = "loan",
  OTHER_LIABILITY = "other_liability",
}

export function getType(type: string): AccountType {
  switch (type) {
    case "depository":
      return AccountType.DEPOSITORY;
    case "credit":
      return AccountType.CREDIT;
    default:
      return AccountType.OTHER_ASSET;
  }
}
