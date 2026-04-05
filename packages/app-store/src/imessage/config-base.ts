import { Logo } from "./assets/logo";

export const baseConfig = {
  name: "iMessage",
  id: "sendblue",
  category: "capture" as const,
  active: true,
  logo: Logo,
  short_description:
    "Use the Midday assistant on the go — upload receipts, track expenses, create invoices, and manage your finances directly from iMessage.",
  description:
    "Take Midday with you. Connect iMessage to access the full Midday assistant from your iPhone.\n\n**Midday Assistant**\nAsk questions about your finances, get spending summaries, check outstanding invoices, or look up any transaction — all through a natural conversation in Messages.\n\n**Upload Receipts & Invoices**\nSnap a photo or forward a receipt and Midday extracts the details automatically. It matches documents to the right transactions so your books stay up to date.\n\n**Create & Track Invoices**\nDraft and send invoices, check payment status, and get notified when invoices are paid or overdue — without opening the app.\n\n**Easy Setup**\nScan a QR code to connect your phone number. Works with any iPhone — just send a message to get started.",
  settings: [
    {
      id: "transactions",
      label: "Transactions",
      description: "Get notified about new transactions and spending activity.",
      type: "switch" as const,
      required: false,
      value: true,
    },
    {
      id: "invoices",
      label: "Invoices",
      description:
        "Get notified when invoices are paid, overdue, or need attention.",
      type: "switch" as const,
      required: false,
      value: true,
    },
    {
      id: "receipts",
      label: "Receipt Processing",
      description:
        "Automatically extract and match receipts sent via iMessage.",
      type: "switch" as const,
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Notifications",
      description:
        "Get notified when uploads are matched to transactions or need review.",
      type: "switch" as const,
      required: false,
      value: true,
    },
  ],
};
