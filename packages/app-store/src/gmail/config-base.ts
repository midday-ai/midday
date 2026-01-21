import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Gmail",
  id: "gmail",
  category: "capture",
  active: true,
  logo: Logo,
  short_description:
    "Automatically capture receipts and invoices from your Gmail inbox. Documents are extracted and matched to transactions in real-time.",
  description:
    "Manually tracking down receipts and invoices buried in your inbox creates unnecessary delays in your financial workflow. The Gmail integration automatically monitors your inbox for incoming financial documents, extracting PDF attachments in real-time as they arrive.\n\n**Continuous Monitoring**\nOnce connected, Midday continuously scans your Gmail for new receipts and invoices without any manual intervention. Documents are captured as soon as they hit your inbox.\n\n**Intelligent Extraction**\nKey information like amounts, dates, and vendor details are automatically extracted from your documents and matched to the corresponding transactions in your account.\n\n**Secure Access**\nThe integration uses OAuth authentication for secure Gmail access. Midday only reads emails with PDF attachments and never accesses other content in your inbox.",
  settings: [],
};
