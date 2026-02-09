import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Stripe Payments",
  id: "stripe-payments",
  category: "payments",
  active: true,
  logo: Logo,
  short_description: "Accept credit card and other payments on your invoices.",
  description:
    "Let customers pay invoices online via credit card, Apple Pay, Google Pay, and more. Payments go directly to your Stripe account.\n\n**Easy Setup**\nConnect your Stripe account in one click. No complex configuration required.\n\n**Multiple Payment Methods**\nAccept credit cards, debit cards, Apple Pay, Google Pay, and other payment methods supported by Stripe.\n\n**Automatic Status Updates**\nInvoice status automatically updates to paid when payment is received.\n\n**Secure & Reliable**\nAll payments are processed securely through Stripe. You maintain full control of your Stripe account.",
  settings: [], // No settings needed - payment toggle is controlled per invoice template
};
