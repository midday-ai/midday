"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Database } from "../types";

// Initialize Stripe with the secret key for server-side operations
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Change to control trial period length
const TRIAL_PERIOD_DAYS = 2;

const toDateTime = (secs: number) => {
  var t = new Date(secs * 1000); // Convert seconds to milliseconds
  return t.toISOString(); // Return ISO 8601 formatted string
};

/**
 * Upserts a product record into the database.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Stripe.Product} product - The Stripe product object to upsert.
 * @param {SupabaseClient<T>} client - The Supabase client instance for the database.
 * @returns {Promise<{ id: string }>} - A promise that resolves to an object containing the product ID.
 * @throws {Error} - Throws an error if the upsert operation fails.
 */
const upsertProductRecord = async <T extends Database>(
  product: Stripe.Product,
  client: SupabaseClient<T>,
): Promise<{ id: string }> => {
  type Tables = T["public"]["Tables"];
  type ProductRecord = Tables["products"]["Row"];
  type ProductInsert = Tables["products"]["Insert"];

  const productData: ProductInsert = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error: upsertError } = await client
    .from("products")
    .upsert(productData as any);

  if (upsertError)
    throw new Error(`Product insert/update failed: ${upsertError.message}`);

  return { id: product.id };
};

/**
 * Upserts a price record into the database, with retry logic for foreign key constraint errors.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Stripe.Price} price - The Stripe price object to upsert.
 * @param {SupabaseClient<T>} client - The Supabase client instance for the database.
 * @param {number} [retryCount=0] - The current retry attempt count.
 * @param {number} [maxRetries=3] - The maximum number of retry attempts.
 * @returns {Promise<void>} - A promise that resolves when the upsert operation completes.
 * @throws {Error} - Throws an error if the upsert operation fails after the maximum retries.
 */
const upsertPriceRecord = async <T extends Database>(
  price: Stripe.Price,
  client: SupabaseClient<T>,
  retryCount = 0,
  maxRetries = 3,
) => {
  type Tables = T["public"]["Tables"];
  type PriceInsert = Tables["prices"]["Insert"];

  const priceData: PriceInsert = {
    id: price.id,
    product_id: typeof price.product === "string" ? price.product : "",
    active: price.active,
    currency: price.currency,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? TRIAL_PERIOD_DAYS,
  };

  const { error: upsertError } = await client
    .from("prices")
    .upsert(priceData as any);

  if (upsertError?.message.includes("foreign key constraint")) {
    if (retryCount < maxRetries) {
      console.log(`Retry attempt ${retryCount + 1} for price ID: ${price.id}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await upsertPriceRecord(price, client, retryCount + 1, maxRetries);
    } else {
      throw new Error(
        `Price insert/update failed after ${maxRetries} retries: ${upsertError.message}`,
      );
    }
  } else if (upsertError) {
    throw new Error(`Price insert/update failed: ${upsertError.message}`);
  } else {
    console.log(`Price inserted/updated: ${price.id}`);
  }
};

/**
 * Deletes a product record from the database.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Stripe.Product} product - The Stripe product object to delete.
 * @param {SupabaseClient<T>} client - The Supabase client instance for the database.
 * @returns {Promise<void>} - A promise that resolves when the deletion operation completes.
 * @throws {Error} - Throws an error if the deletion operation fails.
 */
const deleteProductRecord = async <T extends Database>(
  product: Stripe.Product,
  client: SupabaseClient<T>,
) => {
  const { error: deletionError } = await client
    .from("products")
    .delete()
    .eq("id", product.id);

  if (deletionError)
    throw new Error(`Product deletion failed: ${deletionError.message}`);
  console.log(`Product deleted: ${product.id}`);
};

/**
 * Deletes a price record from the database.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Stripe.Price} price - The Stripe price object to delete.
 * @param {SupabaseClient<T>} client - The Supabase client instance for the database.
 * @returns {Promise<void>} - A promise that resolves when the deletion operation completes.
 * @throws {Error} - Throws an error if the deletion operation fails.
 */
const deletePriceRecord = async <T extends Database>(
  price: Stripe.Price,
  client: SupabaseClient<T>,
) => {
  const { error: deletionError } = await client
    .from("prices")
    .delete()
    .eq("id", price.id);

  if (deletionError)
    throw new Error(`Price deletion failed: ${deletionError.message}`);
  console.log(`Price deleted: ${price.id}`);
};

/**
 * Upserts a customer record into the Supabase database.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {string} uuid - The UUID of the customer.
 * @param {string} customerId - The Stripe customer ID.
 * @param {SupabaseClient<T>} client - The Supabase client instance for the database.
 * @returns {Promise<string>} - A promise that resolves to the Stripe customer ID.
 * @throws {Error} - Throws an error if the upsert operation fails.
 */
const upsertCustomerToSupabase = async <T extends Database>(
  uuid: string,
  customerId: string,
  client: SupabaseClient<T>,
) => {
  type Tables = T["public"]["Tables"];
  type CustomerInsert = Tables["customers"]["Insert"];

  const customerData: CustomerInsert = {
    id: uuid,
    stripe_customer_id: customerId,
  };

  const { error: upsertError } = await client
    .from("customers")
    .upsert(customerData as any);

  if (upsertError)
    throw new Error(
      `Supabase customer record creation failed: ${upsertError.message}`,
    );
  return customerId;
};

/**
 * Creates or retrieves a customer in Stripe and upserts the customer record in Supabase.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Object} params - The parameters for the function.
 * @param {string} params.email - The email of the customer.
 * @param {string} params.uuid - The UUID of the customer.
 * @param {SupabaseClient<T>} params.client - The Supabase client instance for the database.
 * @returns {Promise<string>} - A promise that resolves to the Stripe customer ID.
 * @throws {Error} - Throws an error if the operation fails.
 */
export const createOrRetrieveCustomer = async <T extends Database>({
  email,
  uuid,
  client,
}: {
  email: string;
  uuid: string;
  client: SupabaseClient<T>;
}) => {
  type Tables = T["public"]["Tables"];
  type CustomerInsert = Tables["customers"]["Insert"];
  type CustomerUpdate = Tables["customers"]["Update"];

  // Check if the customer already exists in Supabase
  const { data: existingSupabaseCustomer, error: queryError } = await client
    .from("customers")
    .select("*")
    .eq("id", uuid)
    .maybeSingle();

  if (queryError) {
    throw new Error(`Supabase customer lookup failed: ${queryError.message}`);
  }

  // Retrieve the Stripe customer ID using the Supabase customer ID, with email fallback
  let stripeCustomerId: string | undefined;
  if (
    existingSupabaseCustomer &&
    "stripe_customer_id" in existingSupabaseCustomer
  ) {
    const stripeId = existingSupabaseCustomer.stripe_customer_id;
    if (typeof stripeId === "string") {
      const existingStripeCustomer = await stripe.customers.retrieve(stripeId);
      stripeCustomerId = existingStripeCustomer.id;
    }
  } else {
    console.log(
      "no existing supabase customer, attempting to retrieve customer by email from stripe",
      {
        email,
        uuid,
      },
    );
    // If Stripe ID is missing from Supabase, try to retrieve Stripe customer ID by email
    const stripeCustomers = await stripe.customers.list({ email: email });
    stripeCustomerId =
      stripeCustomers.data.length > 0
        ? stripeCustomers?.data[0]?.id
        : undefined;
  }

  // If still no stripeCustomerId, create a new customer in Stripe
  const stripeIdToInsert = stripeCustomerId
    ? stripeCustomerId
    : await createCustomerInStripe(uuid, email);

  if (!stripeIdToInsert) throw new Error("Stripe customer creation failed.");

  if (existingSupabaseCustomer && stripeCustomerId) {
    // If Supabase has a record but doesn't match Stripe, update Supabase record
    if (
      "stripe_customer_id" in existingSupabaseCustomer &&
      existingSupabaseCustomer.stripe_customer_id !== stripeCustomerId
    ) {
      const { error: updateError } = await client
        .from("customers")
        .update({ stripe_customer_id: stripeIdToInsert } as any)
        .eq("id", uuid);

      if (updateError)
        throw new Error(
          `Supabase customer record update failed: ${updateError.message}`,
        );

      console.warn(
        `Supabase customer record mismatched Stripe ID. Supabase record updated.`,
      );
    }

    // If Supabase has a record and matches Stripe, return Stripe customer ID
    return stripeCustomerId;
  } else {
    console.warn(
      `Supabase customer record was missing. A new record was created.`,
    );
    // If Supabase has no record, create a new record and return Stripe customer ID
    const upsertedStripeCustomer = await upsertCustomerToSupabase(
      uuid,
      stripeIdToInsert,
      client,
    );
    if (!upsertedStripeCustomer)
      throw new Error("Supabase customer record creation failed.");
    return upsertedStripeCustomer;
  }
};

/**
 * Creates a customer in Stripe.
 *
 * @param {string} uuid - The UUID of the customer.
 * @param {string} email - The email of the customer.
 * @returns {Promise<string>} - A promise that resolves to the Stripe customer ID.
 * @throws {Error} - Throws an error if the customer creation fails.
 */
const createCustomerInStripe = async (
  uuid: string,
  email: string,
): Promise<string> => {
  const customerData: Stripe.CustomerCreateParams = {
    metadata: {
      supabaseUUID: uuid,
    },
  };

  if (email) customerData.email = email;
  const customer = await stripe.customers.create(customerData);
  return customer.id;
};

/**
 * Manages the status change of a subscription in Stripe and upserts the subscription record in Supabase.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Object} params - The parameters for the function.
 * @param {string} params.subscriptionId - The ID of the subscription.
 * @param {string} params.customerId - The ID of the customer.
 * @param {boolean} [params.createAction=false] - Whether the action is a creation action.
 * @param {SupabaseClient<T>} params.client - The Supabase client instance for the database.
 * @returns {Promise<void>} - A promise that resolves when the operation completes.
 * @throws {Error} - Throws an error if the operation fails.
 */
export const manageSubscriptionStatusChange = async <T extends Database>({
  subscriptionId,
  customerId,
  createAction = false,
  client,
}: {
  subscriptionId: string;
  customerId: string;
  createAction?: boolean;
  client: SupabaseClient<T>;
}) => {
  type Tables = T["public"]["Tables"];
  type SubscriptionInsert = Tables["subscriptions"]["Insert"];

  // Get customer's UUID from mapping table.
  const { data: customerData, error: noCustomerError } = await client
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (noCustomerError)
    throw new Error(`Customer lookup failed: ${noCustomerError.message}`);

  const customer = customerData as unknown as Tables["customers"]["Row"];
  const uuid = customer?.id;
  if (!uuid) throw new Error("Customer UUID not found");

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });

  // Upsert the latest status of the subscription object.
  const subscriptionData: SubscriptionInsert = {
    id: subscription.id,
    user_id: uuid,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price?.id ?? null,
    quantity: subscription.items.data[0]?.quantity ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? toDateTime(subscription.cancel_at)
      : null,
    canceled_at: subscription.canceled_at
      ? toDateTime(subscription.canceled_at)
      : null,
    current_period_start: toDateTime(subscription.current_period_start),
    current_period_end: toDateTime(subscription.current_period_end),
    created: toDateTime(subscription.created),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at) : null,
    trial_start: subscription.trial_start
      ? toDateTime(subscription.trial_start)
      : null,
    trial_end: subscription.trial_end
      ? toDateTime(subscription.trial_end)
      : null,
  };

  console.log("subscriptionData to upsert", subscriptionData);

  const { error: upsertError } = await client
    .from("subscriptions")
    .upsert(subscriptionData as any);

  if (upsertError)
    throw new Error(
      `Subscription insert/update failed: ${upsertError.message}`,
    );

  console.log(
    `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`,
  );

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (createAction && subscription.default_payment_method && uuid) {
    await copyBillingDetailsToCustomer({
      uuid,
      paymentMethod:
        subscription.default_payment_method as Stripe.PaymentMethod,
      client,
    });
  }
};

/**
 * Copies billing details from a payment method to a customer record in Supabase.
 *
 * @template T - The type of the database (BusinessDatabase, ConsumerDatabase, or SolopreneurDatabase).
 * @param {Object} params - The parameters for the function.
 * @param {string} params.uuid - The UUID of the customer.
 * @param {Stripe.PaymentMethod} params.paymentMethod - The payment method object.
 * @param {SupabaseClient<T>} params.client - The Supabase client instance for the database.
 * @returns {Promise<void>} - A promise that resolves when the operation completes.
 * @throws {Error} - Throws an error if the update operation fails.
 */
const copyBillingDetailsToCustomer = async <T extends Database>({
  uuid,
  paymentMethod,
  client,
}: {
  uuid: string;
  paymentMethod: Stripe.PaymentMethod;
  client: SupabaseClient<T>;
}) => {
  const customer = paymentMethod.customer as string;
  const { name, phone, address } = paymentMethod.billing_details;
  if (!name || !phone || !address) return;

  const { error: updateError } = await client
    .from("users")
    .update({
      billing_address: { ...address },
      payment_method: { ...paymentMethod[paymentMethod.type] },
    } as any)
    .eq("id", uuid);

  if (updateError)
    throw new Error(
      `Updating user billing details failed: ${updateError.message}`,
    );
};

export {
  copyBillingDetailsToCustomer,
  deletePriceRecord,
  deleteProductRecord,
  upsertCustomerToSupabase,
  upsertPriceRecord,
  upsertProductRecord,
};
