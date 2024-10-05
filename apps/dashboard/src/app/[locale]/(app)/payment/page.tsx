import Pricing from "@/components/forms/pricing-form";
import { UserMenu } from "@/components/user-menu";
import config from "@/config";
import { Icons } from "@midday/ui/icons";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getProducts, getUserSubscriptions } from "@midday/stripe";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";

export const metadata: Metadata = {
  title: `Payment | ${config.company}`,
};

/**
 * Renders the payment page component.
 *
 * This asynchronous function handles the following tasks:
 * 1. Initializes the Supabase client
 * 2. Retrieves the current user's information
 * 3. Fetches product and subscription data
 * 4. Renders the payment page layout with header, main content, and footer
 *
 * @async
 * @function
 * @returns {Promise<JSX.Element>} The rendered payment page component
 */
const payment = async (): Promise<JSX.Element> => {
  const supabase = createClient();
  const user = await getUser();
  const currentYear = new Date().getFullYear();

  // Fetch products and user subscription data concurrently
  const [products, subscription] = await Promise.all([
    getProducts(supabase, true /** invalidate cache */),
    getUserSubscriptions(
      user?.data?.id as string,
      supabase,
      true /** invalidate cache */,
    ),
  ]);

  return (
    <>
      <header className="absolute left-0 right-0 flex w-full items-center justify-between">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/">
            <Icons.Logo />
          </Link>
        </div>

        <div className="mr-5 mt-4 md:mr-10 md:mt-10">
          <Suspense>
            <UserMenu onlySignOut />
          </Suspense>
        </div>
      </header>
      <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        <main className="m-auto flex-1">
          <div className="md:min-w-6xl py-12 md:py-24 lg:py-32">
            {products && (
              <Pricing
                user={user?.data}
                products={products}
                subscription={subscription}
              />
            )}
          </div>
        </main>
        <footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t px-4 py-6 sm:flex-row md:px-6">
          <p className="text-left text-xs text-muted-foreground">
            &copy; {currentYear} {config.company}. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:ml-auto sm:gap-6">
            <Link
              href={`${config.webUrl}/terms`}
              className="text-left text-xs underline-offset-4 hover:underline"
              prefetch={false}
            >
              Terms of Service
            </Link>
            <Link
              href={`${config.webUrl}/policy`}
              className="text-left text-xs underline-offset-4 hover:underline"
              prefetch={false}
            >
              Privacy
            </Link>
          </nav>
        </footer>
      </div>
    </>
  );
};

export default payment;
