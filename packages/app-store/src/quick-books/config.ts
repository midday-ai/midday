import { Logo } from "./assets/logo";

export default {
  name: "QuickBooks",
  id: "quickbooks",
  category: "Accounting",
  active: false,
  logo: Logo,
  short_description:
    "Export transactions and receipts to QuickBooks Online. Keep your books up-to-date without manual data entry.",
  description:
    "Connect Midday with QuickBooks Online to streamline your accounting workflow.\n\n**Manual Transaction Export**\nExport enriched transactions from Midday to QuickBooks as purchases and sales receipts when you're ready. Review and categorize transactions first, then push them to your accounting software with a single click.\n\n**Receipt & Invoice Attachments**\nReceipts and invoices matched to transactions in Midday are automatically attached to the corresponding entries in QuickBooks, making audit preparation effortless.\n\n**Smart Account Mapping**\nTransaction categories from Midday are mapped to your QuickBooks chart of accounts.",
  images: [] as string[],
  settings: [],
  config: {},
};
