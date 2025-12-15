import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Xero",
  id: "xero",
  category: "Accounting",
  active: true,
  logo: Logo,
  short_description:
    "Sync transactions and receipts to Xero automatically. Keep your books up-to-date without manual data entry.",
  description:
    "Connect Midday with Xero to streamline your accounting workflow and close your books faster.\n\n**Automatic Transaction Sync**\nTransactions from your connected bank accounts are automatically pushed to Xero, eliminating manual data entry and reducing errors.\n\n**Receipt & Invoice Attachments**\nReceipts and invoices matched to transactions in Midday are automatically attached to the corresponding entries in Xero, making audit preparation effortless.\n\n**Flexible Sync Options**\nChoose between automatic daily sync or manual export when you're ready. Perfect for businesses that want hands-off bookkeeping or those who prefer to review before syncing.\n\n**Smart Categorization**\nTransaction categories from Midday are mapped to your Xero chart of accounts, maintaining consistency across both platforms.",
  settings: [
    {
      id: "autoSync",
      label: "Automatic Sync",
      description:
        "Automatically sync transactions to Xero daily. When disabled, you can manually export transactions from the Export menu.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "syncAttachments",
      label: "Include Attachments",
      description:
        "Automatically upload receipts and invoices as attachments to the corresponding Xero transactions.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};

