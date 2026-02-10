import type { Metadata } from "next";
import Link from "next/link";
import { OpenURL } from "@/components/open-url";
import { Plans } from "@/components/plans";
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

  // Extract first name for personalization
  const firstName = user?.fullName ? user.fullName.split(" ").at(0) : "";

  // Calculate days left
  const daysLeft = getTrialDaysLeft(team.createdAt);

  const hasDiscount = true;
  const discountPrice = 49;

  const getTitle = () => {
    // Benefit-focused titles with urgency and value proposition
    if (daysLeft && daysLeft > 0) {
      if (hasDiscount) {
        return "Secure your 50% discount before trial ends";
      }
      return "Unlock full access to Midday";
    }

    // Expired trial - emphasize value and opportunity
    if (hasDiscount) {
      return "Limited-time offer: Save 50% on Pro";
    }

    return "Unlock full access to Midday";
  };

  const getDescription = () => {
    const greeting = firstName ? `Hi ${firstName}, ` : "";

    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return `${greeting}Your trial ends in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}. Choose a plan now to continue using all of Midday's features and secure our limited-time discount—save 50% on the Pro plan.`;
      }

      return `${greeting}Your trial has ended. Choose a plan to continue using all of Midday's features and unlock your full potential.`;
    }

    if (hasDiscount && discountPrice) {
      const saveAmount = 99 - discountPrice;
      const savePercentage = Math.round((saveAmount / 99) * 100);

      return `${greeting}As a valued early customer, you qualify for our special discount pricing. Get the Pro plan for $${discountPrice}/month instead of the regular $99/month and save ${savePercentage}%.`;
    }

    return `${greeting}Choose a plan to continue using all of Midday's features.`;
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] md:py-12 md:-ml-8">
      <div className="w-full max-w-[696px] p-8">
        <div className="mb-8 md:mt-8">
          <h1 className="text-xl font-semibold leading-none tracking-tight mb-2">
            {getTitle()}
          </h1>
          <p className="text-sm text-muted-foreground">{getDescription()}</p>
        </div>

        <Plans />

        <p className="text-xs text-muted-foreground mt-6 text-center">
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
