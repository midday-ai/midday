import { Logo } from "./assets/logo";

export default {
  name: "E-Invoice",
  id: "e-invoice",
  category: "payments",
  active: true,
  logo: Logo,
  short_description:
    "Automatically send e-invoices via the Peppol network for compliant electronic invoicing across Europe.",
  description:
    "Enable compliant e-invoice delivery via the Peppol network.\n\n**How It Works**\nWhen you enable e-invoicing on an invoice template and your customer has a Peppol ID, invoices are automatically delivered via the Peppol network instead of email.\n\n**Automatic Fallback**\nIf Peppol delivery fails after multiple retry attempts, the invoice is automatically sent via traditional email with PDF attachment.\n\n**Customer Setup**\nAdd your customer's Peppol ID (e.g., 0192:123456789) in their customer profile.\n\n**Company Setup**\nConfigure your company details in Settings > Company.",
  images: [],
  settings: [],
  config: {},
};

