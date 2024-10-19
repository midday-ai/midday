"use client";

import { Button } from "@midday/ui/button";
import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  checkoutWithStripe,
  getErrorRedirect,
  getStripe,
  Price as StripePrice,
} from "@midday/stripe";
import { createClient } from "@midday/supabase/client";
import {
  PriceSchema,
  ProductSchema,
  SubscriptionSchema,
  UserSchema,
} from "@midday/supabase/types";

/**
 * Type alias for the Subscription table from the database.
 */
type Subscription = SubscriptionSchema;

/**
 * Type alias for the Product table from the database.
 */
type Product = ProductSchema;

/**
 * Type alias for the Price table from the database.
 */
type Price = PriceSchema;

/**
 * Type alias for the User table from the database.
 */
type User = UserSchema;

/**
 * Interface extending the Product type to include an array of prices.
 */
interface ProductWithPrices extends Product {
  prices: Price[];
}

/**
 * Interface extending the Price type to include the associated product.
 */
interface PriceWithProduct extends Price {
  products: Product | null;
}

/**
 * Interface extending the Subscription type to include the associated price with product.
 */
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

/**
 * Props interface for the Pricing component.
 */
interface Props {
  /** The current user, or null/undefined if not logged in */
  user: User | null | undefined;
  /** Array of products with their associated prices */
  products: ProductWithPrices[];
  /** The user's current subscription, if any */
  subscription: SubscriptionWithProduct | null;
}

/**
 * Type representing the possible billing intervals.
 */
type BillingInterval = "lifetime" | "year" | "month";

/**
 * Pricing component that displays product pricing plans and handles subscriptions.
 *
 * @param props - The component props
 * @returns A React component displaying pricing plans
 */
export default function Pricing({ user, products, subscription }: Props) {
  const intervals = Array.from(
    new Set(
      products.flatMap((product) =>
        product?.prices?.map((price) => price?.interval),
      ),
    ),
  );

  const router = useRouter();
  const client = createClient();

  // State for managing the selected billing interval and loading state
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  /**
   * Handles the Stripe checkout process when a user selects a plan.
   *
   * @param price - The selected price object
   */
  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push("/login");
    }

    const currentPrice: StripePrice = {
      id: price.id,
      interval: price.interval || "month",
      interval_count: price.interval_count || 1,
      product_id: price.product_id || "",
      trial_period_days: price.trial_period_days || 0,
      type: price.type || "recurring",
      unit_amount: price.unit_amount!,
      description: "",
      metadata: {},
    };

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      currentPrice,
      "/teams",
      currentPath /** redirect to the current page on errors */,
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setPriceIdLoading(undefined);
      return router.push(
        getErrorRedirect(
          currentPath,
          "An unknown error occurred.",
          "Please try again later or contact a system administrator.",
        ),
      );
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });

    setPriceIdLoading(undefined);
  };

  if (!products.length) {
    return (
      <section>
        <div className="m-auto mx-auto flex-1 px-4 py-8 sm:px-6 sm:py-24 lg:px-8">
          <div className="sm:align-center sm:flex sm:flex-col"></div>
          <p className="text-4xl font-extrabold text-foreground sm:text-center sm:text-6xl">
            No subscription pricing plans found.
          </p>
          <div className="mt-[5%] flex flex-col items-center justify-center">
            <p className="text-2xl text-muted-foreground">
              We couldn't find any pricing plans to display.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Please check back later or contact our support team for more
              information.
            </p>
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <Card>
        <div className="m-auto mx-auto flex-1 px-4 py-8 sm:px-6 sm:py-24 lg:px-8">
          <div className="sm:align-center sm:flex sm:flex-col">
            <h1 className="text-4xl font-extrabold text-foreground sm:text-center sm:text-6xl">
              Pricing Plans
            </h1>
            <p className="m-auto mt-5 max-w-2xl text-xl text-zinc-200 sm:text-center sm:text-2xl">
              Choose the plan that fits your needs and budget.
            </p>
            <div className="relative mt-6 flex self-center rounded-lg border border-foreground bg-background text-foreground p-0.5 sm:mt-8">
              {intervals.includes("month") && (
                <button
                  onClick={() => setBillingInterval("month")}
                  type="button"
                  className={`${
                    billingInterval === "month"
                      ? "relative w-1/2 border-foreground bg-background text-foreground shadow-sm"
                      : "relative ml-0.5 w-1/2 border border-transparent text-background/2"
                  } m-1 whitespace-nowrap rounded-md py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 sm:w-auto sm:px-8`}
                >
                  Monthly billing
                </button>
              )}
              {intervals.includes("year") && (
                <button
                  onClick={() => setBillingInterval("year")}
                  type="button"
                  className={`${
                    billingInterval === "year"
                      ? "relative w-1/2 border-foreground bg-background text-foreground shadow-sm"
                      : "relative ml-0.5 w-1/2 border border-transparent text-background/2"
                  } m-1 whitespace-nowrap rounded-md py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 sm:w-auto sm:px-8`}
                >
                  Yearly billing
                </button>
              )}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6 space-y-0 sm:mt-16 lg:mx-auto lg:max-w-4xl xl:mx-0 xl:max-w-none">
            {products.map((product) => {
              const price = product?.prices?.find(
                (price) => price.interval === billingInterval,
              );
              if (!price) return null;
              const priceString = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: price.currency!,
                minimumFractionDigits: 0,
              }).format((price?.unit_amount || 0) / 100);
              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex flex-col divide-y divide-zinc-600 rounded-lg bg-background shadow-sm",
                    {
                      "border border-pink-500": subscription
                        ? product.name === subscription?.prices?.products?.name
                        : product.name === "Freelancer",
                    },
                    "flex-1", // This makes the flex item grow to fill the space
                    "basis-1/3", // Assuming you want each card to take up roughly a third of the container's width
                    "max-w-xs", // Sets a maximum width to the cards to prevent them from getting too large
                  )}
                >
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold leading-6 text-foreground">
                      {product.name}
                    </h2>
                    <p className="mt-4 text-zinc-300">{product.description}</p>
                    <p className="mt-8 flex flex-col">
                      <span className="white text-5xl font-extrabold">
                        {priceString}
                      </span>
                      <span className="text-base font-medium text-foreground/50">
                        per {billingInterval}
                      </span>
                    </p>
                    <Button
                      type="button"
                      disabled={priceIdLoading === price.id}
                      onClick={() => handleStripeCheckout(price)}
                      className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-md px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                      {subscription ? "Manage" : "Choose Plan"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }
}
