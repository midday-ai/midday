import { Logo } from "./assets/logo";

export default {
  name: "QuickBooks",
  id: "quickbooks",
  category: "Accounting",
  active: true,
  logo: Logo,
  short_description:
    "Sync transactions and receipts to QuickBooks Online automatically. Keep your books up-to-date without manual data entry.",
  description:
    "Connect Midday with QuickBooks Online to streamline your accounting workflow.\n\n**Automatic Transaction Sync**\nTransactions from your connected bank accounts are automatically pushed to QuickBooks as purchases and sales receipts, eliminating manual data entry.\n\n**Receipt & Invoice Attachments**\nReceipts and invoices matched to transactions in Midday are automatically attached to the corresponding entries in QuickBooks, making audit preparation effortless.\n\n**Flexible Sync Options**\nChoose between automatic daily sync or manual export when you're ready. Perfect for businesses that want hands-off bookkeeping or those who prefer to review before syncing.\n\n**Smart Account Mapping**\nTransaction categories from Midday are mapped to your QuickBooks chart of accounts.",
  images: [] as string[],
  settings: [
    {
      id: "autoSync",
      label: "Automatic Sync",
      description:
        "Automatically sync transactions to QuickBooks daily. When disabled, you can manually export transactions from the Export menu.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "syncAttachments",
      label: "Include Attachments",
      description:
        "Automatically upload receipts and invoices as attachments to the corresponding QuickBooks transactions.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
  config: {},
};
