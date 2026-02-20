import { Logo } from "./assets/logo";

export default {
  name: "Peppol",
  id: "peppol",
  category: "e-invoicing",
  active: true,
  logo: Logo,
  short_description:
    "Send and receive compliant e-invoices via the Peppol network. Incoming invoices appear in your inbox automatically.",
  description:
    "Connect to the Peppol network to send and receive legally compliant electronic invoices in 30+ countries.\n\n**Send E-Invoices**\nWhen your customer has a Peppol ID, invoices are automatically converted to UBL format, validated, and delivered through the Peppol network alongside the regular email.\n\n**Receive E-Invoices**\nOnce registered, incoming Peppol invoices arrive in your inbox with all data pre-extracted — supplier name, amounts, dates, and invoice number. No manual data entry needed.\n\n**Automatic Matching**\nReceived e-invoices go through the same AI-powered matching pipeline as other inbox items, automatically matching to your bank transactions.\n\n**30+ Countries**\nPeppol is mandatory or widely adopted in Belgium, Germany, Norway, Finland, Sweden, and growing across Europe, Asia-Pacific, and beyond.",
  images: [],
  settings: [],
  onInitialize: () => {
    window.location.href = "/settings/company#e-invoicing";
  },
};
