import { Logo } from "./assets/logo";

// Shared base config - used by both server and client configs
export const baseConfig = {
  name: "Stripe",
  id: "stripe",
  category: "Payments",
  active: true,
  logo: Logo,
  short_description:
    "Sync your Stripe transactions automatically. Track payments, refunds, fees, and payouts in real-time.",
  description:
    "Connect your Stripe account to automatically sync all your payment transactions into Midday.\n\n**Automatic Transaction Sync**\nPayments, refunds, fees, and payouts are automatically imported every 2 hours, giving you a complete picture of your payment activity.\n\n**Track Processing Fees**\nStripe fees are automatically tracked as expenses, helping you understand your true cost of payment processing and maximize tax deductions.\n\n**Complete Money Flow**\nSee exactly where your money comes from and where it goes - from customer payments through to bank payouts.\n\n**Customer-Level Detail**\nUnlike bank statements that only show lump-sum payouts, see individual customer payments with full transaction details.",
  settings: [
    {
      id: "sync_charges",
      label: "Sync Payments",
      description: "Import successful payment transactions from customers",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "sync_refunds",
      label: "Sync Refunds",
      description: "Import refund transactions",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "sync_fees",
      label: "Sync Fees",
      description: "Import Stripe processing fees as expenses",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "sync_payouts",
      label: "Sync Payouts",
      description: "Import payout transfers to your bank account",
      type: "switch",
      required: false,
      value: true,
    },
  ],
};
