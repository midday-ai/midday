import { Logo } from "./assets/logo";

export default {
  name: "E-Invoice",
  id: "e-invoice",
  category: "payments",
  active: true,
  logo: Logo,
  short_description:
    "Send and receive e-invoices via the Peppol network for compliant electronic invoicing.",
  description:
    "Connect to the Peppol e-invoicing network for secure, compliant invoice delivery.\n\n**Automatic Peppol Delivery**\nWhen a customer has a Peppol ID configured, invoices are automatically sent via the Peppol network instead of email. This ensures compliant e-invoice delivery that meets regulatory requirements.\n\n**Fallback to Email**\nIf Peppol delivery fails for any reason, the invoice is automatically sent via traditional email with PDF attachment.\n\n**Optional Notifications**\nChoose to send a lightweight email notification when invoices are delivered via Peppol, so customers know to check their e-invoicing inbox.\n\n**Setup**\nTo enable e-invoicing, you need a DDD Invoices connection key. Contact your administrator or sign up at dddinvoices.com to get started.",
  images: [],
  settings: [],
  config: {},
};

