import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Fortnox",
  id: "fortnox",
  category: "accounting",
  active: true,
  beta: true,
  logo: Logo,
  short_description:
    "Export transactions and receipts to Fortnox. Keep your Swedish accounting compliant and up-to-date.",
  description:
    "Connect Midday with Fortnox to streamline your Swedish accounting workflow.\n\n**Manual Transaction Export**\nExport enriched transactions from Midday to Fortnox as vouchers. Review and categorize transactions in Midday first, then push them to Fortnox with a single click. Vouchers are created as finalized entries - the review happens in Midday before export.\n\n**Receipt & Invoice Attachments**\nReceipts and invoices matched to transactions in Midday are automatically attached to the corresponding vouchers in Fortnox, making audit preparation effortless.\n\n**Smart Account Mapping**\nTransaction categories from Midday are mapped to your Fortnox chart of accounts using Swedish BAS standards.",
  settings: [],
  config: {},
};
