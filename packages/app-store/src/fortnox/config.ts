import { Logo } from "./assets/logo";

export default {
  name: "Fortnox",
  id: "fortnox",
  category: "Accounting",
  active: true,
  logo: Logo,
  short_description:
    "Sync transactions and receipts to Fortnox automatically. Keep your Swedish accounting compliant and up-to-date.",
  description:
    "Connect Midday with Fortnox to streamline your Swedish accounting workflow.\n\n**Automatic Transaction Sync**\nTransactions from your connected bank accounts are automatically pushed to Fortnox as vouchers, eliminating manual data entry and ensuring BAS-compliant bookkeeping.\n\n**Receipt & Invoice Attachments**\nReceipts and invoices matched to transactions in Midday are automatically attached to the corresponding vouchers in Fortnox, making audit preparation effortless.\n\n**Flexible Sync Options**\nChoose between automatic daily sync or manual export when you're ready. Perfect for businesses that want hands-off bookkeeping or those who prefer to review before syncing.\n\n**Smart Account Mapping**\nTransaction categories from Midday are mapped to your Fortnox chart of accounts using Swedish BAS standards.",
  images: [] as string[],
  settings: [
    {
      id: "autoSync",
      label: "Automatic Sync",
      description:
        "Automatically sync transactions to Fortnox daily. When disabled, you can manually export transactions from the Export menu.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "syncAttachments",
      label: "Include Attachments",
      description:
        "Automatically upload receipts and invoices as attachments to the corresponding Fortnox vouchers.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
  config: {},
};
