/**
 * Stripe Currency Utilities (USD-only)
 *
 * Abacus operates exclusively in USD.
 * USD is a standard two-decimal currency: $1.00 = 100 cents in Stripe.
 *
 * @see https://docs.stripe.com/currencies
 */

const USD_MULTIPLIER = 100;

/**
 * Convert a dollar amount to Stripe's smallest unit (cents).
 *
 * @param amount - The amount in dollars
 * @returns The amount in cents, rounded to nearest integer
 *
 * @example
 * toStripeAmount(10.00)  // 1000
 * toStripeAmount(10.50)  // 1050
 * toStripeAmount(99.99)  // 9999
 */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * USD_MULTIPLIER);
}

/**
 * Convert a Stripe amount (cents) back to dollars.
 *
 * @param stripeAmount - The amount in cents
 * @returns The amount in dollars
 *
 * @example
 * fromStripeAmount(1000)  // 10.00
 * fromStripeAmount(1050)  // 10.50
 */
export function fromStripeAmount(stripeAmount: number): number {
  return stripeAmount / USD_MULTIPLIER;
}
