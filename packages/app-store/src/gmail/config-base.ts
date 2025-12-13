import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Gmail",
  id: "gmail",
  category: "Inbox",
  active: true,
  logo: Logo,
  short_description:
    "Connect your Gmail account to automatically sync receipts and invoices from your inbox. Midday extracts data and matches them to your transactions.",
  description:
    "Connect Midday with Gmail to automatically process receipts and invoices from your inbox.\n\n**Automatic Sync**\nMidday automatically syncs attachments from your Gmail account and processes them in the background.\n\n**Smart Extraction**\nWe extract key information (amount, date, vendor) from your documents and automatically match them to the right transactions.\n\n**Seamless Integration**\nYour receipts and invoices are processed automatically without any manual work. Just connect your Gmail account and let Midday handle the rest.",
  settings: [],
};
