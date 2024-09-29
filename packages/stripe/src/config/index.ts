import { BusinessConfig } from "@internal/app-config";
import Stripe from "stripe";

/**
 * Stripe instance for handling payment processing and related operations.
 * 
 * This constant initializes a new Stripe instance with the appropriate configuration.
 * It uses the live secret key if available, falling back to the test secret key.
 * 
 * @remarks
 * The Stripe instance is configured with:
 * - No specific API version (uses the latest version)
 * - Custom app info for Stripe plugin registration
 * 
 * @see {@link https://stripe.com/docs/api/versioning | Stripe API Versioning}
 * @see {@link https://stripe.com/docs/building-plugins#setappinfo | Stripe Plugin Registration}
 * 
 * @example
 * ```typescript
 * import { stripe } from './config';
 * 
 * // Use the stripe instance to create a payment intent
 * const paymentIntent = await stripe.paymentIntents.create({
 *   amount: 1000,
 *   currency: 'usd',
 * });
 * ```
 */
export const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '',
    {
        // https://github.com/stripe/stripe-node#configuration
        // https://stripe.com/docs/api/versioning
        // @ts-ignore
        apiVersion: null,
        // Register this as an official Stripe plugin.
        // https://stripe.com/docs/building-plugins#setappinfo
        appInfo: {
            name: BusinessConfig.company,
            version: '0.0.0',
            url: BusinessConfig.platformUrl
        }
    }
);