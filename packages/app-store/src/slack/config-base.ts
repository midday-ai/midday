import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Slack",
  id: "slack",
  category: "capture",
  active: true,
  logo: Logo,
  short_description:
    "Get transaction notifications and upload receipts directly from Slack. Midday automatically extracts data and matches them to transactions.",
  description:
    "Connect Midday with Slack to streamline your financial workflow without leaving your workspace.\n\n**Transaction Notifications**\nGet notified in your chosen Slack channel whenever new transactions are added, keeping your team informed in real-time.\n\n**Receipt & Invoice Upload**\nUpload receipts, invoices, or any documents directly from Slack. Simply share a file in a channel where Midday is added, and it will automatically be processed.\n\n**Smart Matching**\nMidday extracts key information (amount, date, vendor) from your documents and automatically matches them to the right transactions. You'll receive a notification in the same thread with the match result.\n\n**Approve or Decline**\nReview suggested matches and approve or decline them directly from Slack with one click—no need to switch to the Midday app.",
  settings: [
    {
      id: "transactions",
      label: "Transactions",
      description:
        "Get notified when a new transaction is added. This will notify you in the channel you have selected.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "invoices",
      label: "Invoices",
      description:
        "Get notified when invoices are paid or become overdue. This will notify you in the channel you have selected.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Suggestions",
      description:
        "Get notified when receipts are matched or need review. This will notify you in the same thread where you uploaded the file.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
