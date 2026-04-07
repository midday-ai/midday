import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "WhatsApp",
  id: "whatsapp",
  category: "capture",
  active: true,
  logo: Logo,
  short_description:
    "Use the Midday assistant on the go — upload receipts, track expenses, create invoices, and manage your finances directly from WhatsApp.",
  description:
    "Take Midday with you. Connect WhatsApp to access the full Midday assistant from your phone.\n\n**Midday Assistant**\nAsk questions about your finances, get spending summaries, check outstanding invoices, or look up any transaction — all through a natural conversation.\n\n**Upload Receipts & Invoices**\nSnap a photo or forward a receipt and Midday extracts the details automatically. It matches documents to the right transactions so your books stay up to date.\n\n**Create & Track Invoices**\nDraft and send invoices, check payment status, and get notified when invoices are paid or overdue — without opening the app.\n\n**Easy Setup**\nScan a QR code to connect your WhatsApp number. No app installation required — just start chatting.",
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
      id: "receipts",
      label: "Receipt Processing",
      description:
        "Automatically extract and match receipts sent via WhatsApp.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Notifications",
      description:
        "Get notified when uploads are matched to transactions or need review.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
