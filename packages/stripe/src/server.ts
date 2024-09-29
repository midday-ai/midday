"use server";

// NOTE: don't change this import directive, it works, it may show red
// due to how module resolution works in this package may have to fix that instead
import { createClient } from "@midday/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { createOrRetrieveCustomer } from "./mutations/index";
import { Database } from "./types";
import {
  calculateTrialEndUnixTimestamp,
  getErrorRedirect,
  getURL,
} from "./utils";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

/**
 * Represents the response structure for the checkout process.
 * @typedef {Object} CheckoutResponse
 * @property {string} [errorRedirect] - The URL to redirect to in case of an error.
 * @property {string} [sessionId] - The ID of the created Stripe checkout session.
 */
type CheckoutResponse = {
  errorRedirect?: string;
  sessionId?: string;
};

/**
 * Represents the structure of a price object used in the checkout process.
 * @typedef {Object} Price
 * @property {string} description - A description of the price.
 * @property {string} id - The unique identifier for the price in Stripe.
 * @property {'day' | 'week' | 'month' | 'year'} interval - The billing interval for recurring prices.
 * @property {number} interval_count - The number of intervals between recurring billings.
 * @property {Record<string, string>} metadata - Additional metadata associated with the price.
 * @property {string} product_id - The ID of the product this price is associated with.
 * @property {number} trial_period_days - The number of trial days for this price.
 * @property {'recurring' | 'one_time'} type - Whether this is a recurring or one-time price.
 * @property {number} unit_amount - The amount in cents for this price.
 */
export type Price = {
  description: string;
  id: string;
  interval: "day" | "week" | "month" | "year";
  interval_count: number;
  metadata: Record<string, string>;
  product_id: string;
  trial_period_days: number;
  type: "recurring" | "one_time";
  unit_amount: number;
};

/**
 * Initiates a checkout process with Stripe for a given price.
 *
 * @async
 * @template T
 * @param {Price} price - The price object for the item being purchased.
 * @param {string} [redirectPath="/teams"] - The path to redirect to after successful checkout.
 * @param {string} [errorRedirect="/teams"] - The path to redirect to in case of an error.
 * @returns {Promise<CheckoutResponse>} A promise that resolves to a CheckoutResponse object.
 *
 * @throws {Error} If there's an issue retrieving the user, accessing the customer record, or creating the checkout session.
 *
 * @description
 * This function performs the following steps:
 * 1. Retrieves the current user from Supabase authentication.
 * 2. Creates or retrieves a Stripe customer for the user.
 * 3. Constructs the parameters for the Stripe checkout session.
 * 4. Creates a Stripe checkout session.
 * 5. Returns the session ID on success or an error redirect URL on failure.
 *
 * The function handles both recurring subscriptions and one-time payments.
 * For recurring subscriptions, it sets up a trial period if specified in the price object.
 */
export async function checkoutWithStripe<T extends Database>(
  price: Price,
  redirectPath: string = "/teams",
  errorRedirect: string = "/teams",
): Promise<CheckoutResponse> {
  const client = createClient();
  try {
    // Get the user from Supabase auth
    const {
      error,
      data: { user },
    } = await client.auth.getUser();

    if (error || !user) {
      console.error(error);
      throw new Error("Could not get user session.");
    }

    console.log("user obtained", user);

    // Retrieve or create the customer in Stripe
    let customer: string;
    try {
      customer = await createOrRetrieveCustomer({
        uuid: user.id,
        email: user.email || "",
        client,
      });

      console.log("customer obtained", customer);
    } catch (err) {
      console.error(err);
      throw new Error("Unable to access customer record.", { cause: err });
    }

    // Use the initialized stripe instance
    let params: Stripe.Checkout.SessionCreateParams = {
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer,
      customer_update: {
        address: "auto",
      },
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      cancel_url: getURL(),
      success_url: getURL(redirectPath),
    };

    console.log(
      "Trial end:",
      calculateTrialEndUnixTimestamp(price.trial_period_days),
    );
    if (price.type === "recurring") {
      params = {
        ...params,
        mode: "subscription",
        subscription_data: {
          trial_end: calculateTrialEndUnixTimestamp(price.trial_period_days),
        },
      };
    } else if (price.type === "one_time") {
      params = {
        ...params,
        mode: "payment",
      };
    }

    // Create a checkout session in Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.create(params);
    } catch (err) {
      console.error(err);
      throw new Error("Unable to create checkout session.");
    }

    // Return the session ID
    if (session) {
      return { sessionId: session.id };
    } else {
      throw new Error("Unable to create checkout session.");
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        errorRedirect: getErrorRedirect(
          errorRedirect,
          error.message,
          "Please try again later or contact a system administrator.",
        ),
      };
    } else {
      return {
        errorRedirect: getErrorRedirect(
          errorRedirect,
          "An unknown error occurred.",
          "Please try again later or contact a system administrator.",
        ),
      };
    }
  }
}

/**
 * Creates a Stripe billing portal session for the current user.
 *
 * @async
 * @template T
 * @param {string} currentPath - The current path in the application.
 * @param {SupabaseClient<T>} client - The Supabase client instance.
 * @returns {Promise<string>} A promise that resolves to the URL of the Stripe billing portal.
 *
 * @throws {Error} If there's an issue retrieving the user, accessing the customer record, or creating the billing portal session.
 *
 * @description
 * This function performs the following steps:
 * 1. Retrieves the current user from Supabase authentication.
 * 2. Creates or retrieves a Stripe customer for the user.
 * 3. Creates a Stripe billing portal session for the customer.
 * 4. Returns the URL of the billing portal on success.
 *
 * If any step fails, it returns an error redirect URL.
 *
 * @example
 * ```typescript
 * const supabaseClient = createClient();
 * const portalUrl = await createStripePortal('/account', supabaseClient);
 * // Redirect the user to portalUrl
 * ```
 */
export async function createStripePortal<T extends Database>(
  currentPath: string,
  client: SupabaseClient<T>,
) {
  try {
    const {
      error,
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      if (error) {
        console.error(error);
      }
      throw new Error("Could not get user session.");
    }

    let customer;
    try {
      customer = await createOrRetrieveCustomer({
        uuid: user.id || "",
        email: user.email || "",
        client,
      });
    } catch (err) {
      console.error(err);
      throw new Error("Unable to access customer record.", { cause: err });
    }

    if (!customer) {
      throw new Error("Could not get customer.");
    }

    try {
      const stripeReturnUrl = getURL("/account");
      console.log("Return URL for stripe billing portal:", stripeReturnUrl);
      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: stripeReturnUrl,
      });
      if (!url) {
        throw new Error("Could not create billing portal");
      }
      return url;
    } catch (err) {
      console.error(err);
      throw new Error("Could not create billing portal");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return getErrorRedirect(
        currentPath,
        error.message,
        "Please try again later or contact a system administrator.",
      );
    } else {
      return getErrorRedirect(
        currentPath,
        "An unknown error occurred.",
        "Please try again later or contact a system administrator.",
      );
    }
  }
}
