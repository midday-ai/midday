export enum AccountType {
  DEPOSITORY = "depository",
  CREDIT = "credit",
  OTHER_ASSET = "other_asset",
  LOAN = "loan",
  OTHER_LIABILITY = "other_liability",
}

enum AccountClassification {
  asset = "asset",
  liability = "liability",
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

export function getClassification(type: AccountType): AccountClassification {
  switch (type) {
    case AccountType.CREDIT:
    case AccountType.LOAN:
    case AccountType.OTHER_LIABILITY:
      return AccountClassification.liability;
    default:
      return AccountClassification.asset;
  }
}

type FormatAmountForAssetParams = {
  amount: number;
  type: AccountType;
};

export function formatAmountForAsset({
  amount,
  type,
}: FormatAmountForAssetParams) {
  const classification = getClassification(type);

  if (classification === AccountClassification.asset) {
    return +(amount * -1);
  }

  return +amount;
}
