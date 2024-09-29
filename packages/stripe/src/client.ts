'use client'

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

/**
 * Retrieves the Stripe instance for client-side usage, initializing it if necessary.
 * @returns {Promise<Stripe | null>} A promise that resolves to the Stripe instance.
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    );
  }
  return stripePromise;
};
