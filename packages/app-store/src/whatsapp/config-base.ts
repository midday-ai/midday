import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "WhatsApp",
  id: "whatsapp",
  category: "capture",
  active: true,
  logo: Logo,
  short_description:
    "Forward receipts and invoices directly from WhatsApp. Midday automatically extracts data and matches them to transactions.",
  description:
    "Connect Midday with WhatsApp to capture receipts on the go.\n\n**Easy Setup**\nScan a QR code to connect your WhatsApp number to Midday. No app installation required.\n\n**Receipt & Invoice Upload**\nForward or send photos of receipts, invoices, or any documents directly from WhatsApp. Simply send an image or PDF and it will automatically be processed.\n\n**Smart Matching**\nMidday extracts key information (amount, date, vendor) from your documents and automatically matches them to the right transactions. You'll receive a message with the match result.\n\n**Approve or Decline**\nReview suggested matches and approve or decline them directly from WhatsApp with one tap—no need to open the Midday app.",
  settings: [
    {
      id: "transactions",
      label: "Transactions",
      description:
        "Get grouped WhatsApp alerts for new transactions when a recent chat session is active.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "invoices",
      label: "Invoices",
      description:
        "Get WhatsApp alerts for invoice activity when delivery is allowed within the active messaging window.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "receipts",
      label: "Receipt Processing",
      description:
        "Automatically process receipts and invoices sent via WhatsApp.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Notifications",
      description:
        "Get notified when receipts are matched or need review via WhatsApp.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
