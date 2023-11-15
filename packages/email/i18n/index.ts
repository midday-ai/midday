import { createIntl } from "@formatjs/intl";

const messages = {
  en: {
    "transactions.preview":
      "Hi {firstName}, We found {numberOfTransactions} transactions thats missing receipts. Feel free to attach them to ease your own or your accountants work for upcoming declerations.",
  },
  sv: {
    "transactions.preview":
      "Hi {firstName}, We found {numberOfTransactions} transactions thats missing receipts. Feel free to attach them to ease your own or your accountants work for upcoming declerations.",
  },
};

type Options = {
  locale: string;
};

export function getI18n({ locale }: Options) {
  const intl = createIntl({
    locale,
    messages: messages[locale],
  });

  return {
    t: intl.formatMessage,
  };
}
