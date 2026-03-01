import { getCurrency } from "@midday/location";
import type { Metadata } from "next";
import Link from "next/link";
import { OpenURL } from "@/components/open-url";
import { Plans } from "@/components/plans";
import { UpgradeFAQ } from "@/components/upgrade-faq";
import { getQueryClient, trpc } from "@/trpc/server";
import { getTrialDaysLeft } from "@/utils/trial";

export const metadata: Metadata = {
  title: "Upgrade | Midday",
};

export default async function UpgradePage() {
  const queryClient = getQueryClient();
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  const team = user?.team;

  if (!team || team.plan !== "trial") {
    return null;
  }

  const daysLeft = getTrialDaysLeft(team.createdAt);
  const currency = await getCurrency();

  const getDescription = () => {
    if (daysLeft && daysLeft > 0) {
      return `Your trial ends in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}.`;
    }

    return "Your trial has ended.";
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] md:py-12 md:-ml-8">
      <div className="w-full max-w-[960px] p-8">
        <div className="mb-8 md:mt-8 text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">
            Choose the plan that works for you
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-normal">
            {getDescription()}
          </p>
        </div>

        <Plans currency={currency} />

        <p className="font-sans text-xs text-muted-foreground mt-6 text-center">
          Cancel anytime · Prices in {currency === "EUR" ? "EUR" : "USD"} excl.
          VAT
        </p>

        <UpgradeFAQ />

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Questions?{" "}
          <Link href="/account/support" className="hover:underline">
            Contact support
          </Link>{" "}
          or{" "}
          <OpenURL
            href="https://cal.com/pontus-midday/15min"
            className="hover:underline"
          >
            book a call with the founders
          </OpenURL>
          .
        </p>
      </div>
    </div>
  );
}
