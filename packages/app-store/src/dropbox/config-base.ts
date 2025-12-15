import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Dropbox",
  id: "dropbox",
  category: "Productivity",
  active: true,
  logo: Logo,
  short_description:
    "Automatically import receipts and invoices from your Dropbox folders. Midday extracts data and matches them to transactions.",
  description:
    "Connect Midday with Dropbox to automatically process receipts and invoices from selected folders.\n\n**Easy Setup**\nConnect your Dropbox account and select which folders to watch. No manual file management needed.\n\n**Supported File Types**\nMidday processes PDFs and images (JPEG, PNG, WebP, HEIC/HEIF). Files must be under 10MB in size. During initial sync, up to 50 items will be processed from your selected folders.\n\n**Automatic Processing**\nFiles added to your selected Dropbox folders are automatically imported and processed. Midday extracts key information (amount, date, vendor) from your documents.\n\n**Smart Matching**\nMidday automatically matches your receipts to the right transactions. You'll receive notifications when matches are found or need review.\n\n**Folder Selection**\nChoose specific folders to watch, so only relevant documents are processed. Perfect for organizing receipts by project or category.",
  settings: [
    {
      id: "receipts",
      label: "Receipt Processing",
      description:
        "Automatically process receipts and invoices from selected Dropbox folders.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "matches",
      label: "Match Notifications",
      description: "Get notified when receipts are matched or need review.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
