import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Xero",
  id: "xero",
  category: "accounting",
  active: true,
  beta: true,
  logo: Logo,
  short_description:
    "Export transactions and receipts to Xero. Keep your books up-to-date without manual data entry.",
  description:
    "Connect Midday with Xero to streamline your accounting workflow and close your books faster.\n\n**Manual Transaction Export**\nExport enriched transactions from Midday to Xero when you're ready. Review and categorize transactions first, then push them to your accounting software with a single click.\n\n**Receipt & Invoice Attachments**\nReceipts and invoices matched to transactions in Midday are automatically attached to the corresponding entries in Xero, making audit preparation effortless.\n\n**Smart Categorization**\nTransaction categories from Midday are mapped to your Xero chart of accounts, maintaining consistency across both platforms.",
  settings: [],
};
