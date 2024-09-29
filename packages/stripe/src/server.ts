'use server'

import { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
// NOTE: don't change this import directive, it works, it may show red
// due to how module resolution works in this package may have to fix that instead
import { createClient } from "@midday/supabase/server";
import { createOrRetrieveCustomer } from "./mutations/index";
import { Database } from "./types";
import {
  calculateTrialEndUnixTimestamp,
  getErrorRedirect,
  getURL,
} from "./utils";
// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

type CheckoutResponse = {
  errorRedirect?: string;
  sessionId?: string;
};

export type Price = {
  description: string;
  id: string;
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count: number;
  metadata: Record<string, string>;
  product_id: string;
  trial_period_days: number;
  type: 'recurring' | 'one_time';
  unit_amount: number;
};

export async function checkoutWithStripe<T extends Database>(
  price: Price,
  redirectPath: string = "/account",
  errorRedirect: string = "/account",
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
      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: getURL("/account"),
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
