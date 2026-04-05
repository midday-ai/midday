import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Slack",
  id: "slack",
  category: "capture",
  active: true,
  logo: Logo,
  short_description:
    "Use the Midday assistant in Slack — upload receipts, track expenses, create invoices, and manage your finances without leaving your workspace.",
  description:
    "Bring Midday into your team's workflow. Connect Slack to access the full Midday assistant right where you work.\n\n**Midday Assistant**\nAsk questions about your finances, get spending summaries, check outstanding invoices, or look up any transaction — all from a Slack channel or DM.\n\n**Upload Receipts & Invoices**\nDrop a receipt or invoice into Slack and Midday extracts the details automatically. It matches documents to the right transactions so your books stay up to date.\n\n**Create & Track Invoices**\nDraft and send invoices, check payment status, and get notified when invoices are paid or overdue — without switching apps.\n\n**Team Notifications**\nKeep your team in the loop with real-time notifications for new transactions, invoice activity, and receipt matches in your chosen channel.",
  settings: [
    {
      id: "transactions",
      label: "Transactions",
      description: "Get notified about new transactions and spending activity.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "invoices",
      label: "Invoices",
      description:
        "Get notified when invoices are paid, overdue, or need attention.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Suggestions",
      description:
        "Get notified when uploads are matched to transactions or need review.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
