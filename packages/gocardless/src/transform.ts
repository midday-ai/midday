import { capitalCase } from "change-case";

export const mapTransactionMethod = (method: string) => {
  switch (method) {
    case "Payment":
    case "Bankgiro payment":
    case "Incoming foreign payment":
      return "payment";
    case "Card purchase":
    case "Card foreign purchase":
      return "card_purchase";
    case "Card ATM":
      return "card_atm";
    case "Transfer":
      return "transfer";
    default:
      return "other";
  }
};

const transformName = (transaction) => {
  if (transaction?.additionalInformation) {
    return capitalCase(transaction.additionalInformation);
  }

  if (transaction?.remittanceInformationStructured) {
    return capitalCase(transaction.remittanceInformationStructured);
  }

  if (transaction?.remittanceInformationUnstructured) {
    return capitalCase(transaction.remittanceInformationUnstructured);
  }

  if (transaction?.creditorName) {
    return capitalCase(transaction.creditorName);
  }

  if (transaction?.debtorName) {
    return capitalCase(transaction?.debtorName);
  }

  if (transaction?.remittanceInformationUnstructuredArray?.at(0)) {
    return capitalCase(
      transaction.remittanceInformationUnstructuredArray?.at(0)
    );
  }

  console.log("No transaction name", transaction);
};

const transformDescription = (transaction, name) => {
  if (transaction?.remittanceInformationUnstructuredArray?.length) {
    const text = transaction?.remittanceInformationUnstructuredArray.join(" ");
    const description = capitalCase(text);

    // NOTE: Sometimes the description is the same as name
    // Let's skip that and just save if they are not the same
    if (description !== name) {
      return description;
    }
  }
};

export const transformTransactions = (transactions, { teamId, accountId }) => {
  // We want to insert transactions in reversed order so the incremental id in supabase is correct
  return transactions?.reverse().map((transaction) => {
    const method = mapTransactionMethod(
      transaction.proprietaryBankTransactionCode
    );

    let currencyExchange: { rate: number; currency: string } | undefined;

    if (Array.isArray(transaction.currencyExchange)) {
      const rate = Number.parseFloat(
        transaction.currencyExchange.at(0)?.exchangeRate ?? ""
      );

      if (rate) {
        const currency = transaction.currencyExchange.at(0)?.sourceCurrency;

        if (currency) {
          currencyExchange = {
            rate,
            currency,
          };
        }
      }
    }

    const name = transformName(transaction);

    return {
      date: transaction.valueDate,
      name,
      method: method || "unknown",
      internal_id: `${teamId}_${transaction.internalTransactionId}`,
      amount: transaction.transactionAmount.amount,
      currency: transaction.transactionAmount.currency,
      bank_account_id: accountId,
      category: transaction.transactionAmount.amount > 0 ? "income" : null,
      team_id: teamId,
      currency_rate: currencyExchange?.rate,
      currency_source: currencyExchange?.currency,
      balance: transaction?.balanceAfterTransaction?.balanceAmount?.amount,
      description: transformDescription(transaction, name),
      status: "posted",
    };
  });
};
