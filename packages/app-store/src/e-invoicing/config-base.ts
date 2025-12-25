import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "E-Invoicing",
  id: "e-invoicing",
  category: "Invoicing",
  active: true,
  beta: true,
  logo: Logo,
  short_description:
    "Send invoices via the Peppol network. Deliver e-invoices directly to your customers' accounting systems.",
  description:
    "Connect to the Peppol e-invoicing network to send compliant electronic invoices.\n\n**Peppol Network**\nSend invoices directly to recipients on the Peppol network - the global standard for business-to-business and business-to-government e-invoicing used across Europe, Australia, Singapore, and more.\n\n**Automatic Delivery**\nWhen your customer has a Peppol ID, invoices are automatically delivered to their accounting system in structured format (UBL), eliminating manual data entry.\n\n**Delivery Tracking**\nTrack the status of your e-invoices - know when they're sent, delivered, and received by your customers.\n\n**Compliance**\nMeet e-invoicing mandates in countries requiring Peppol for B2G (business-to-government) transactions.",
  settings: [],
  config: {},
};

