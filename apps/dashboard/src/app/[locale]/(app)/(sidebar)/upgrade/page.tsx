import { OpenURL } from "@/components/open-url";
import { Plans } from "@/components/plans";
import { getQueryClient, trpc } from "@/trpc/server";
import { getTrialDaysLeft } from "@/utils/trial";
import type { Metadata } from "next";
import Link from "next/link";

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

  // Calculate days left
  const daysLeft = getTrialDaysLeft(team.createdAt);

  const hasDiscount = true;
  const discountPrice = 49;

  const getTitle = () => {
    if (daysLeft && daysLeft > 0) {
      return `Pro trial - ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
    }

    return hasDiscount ? "Special Discount Offer" : "Choose plan";
  };

  const getDescription = () => {
    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return `Your trial will end in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}, after the trial period you will have read access only.`;
      }

      return "Your trial period has ended. Please choose a plan to continue using Midday.";
    }

    if (hasDiscount && discountPrice) {
      const saveAmount = 99 - discountPrice;
      const savePercentage = Math.round((saveAmount / 99) * 100);

      return `As a valued early customer, you qualify for our special discount pricing. Get the Pro plan for $${discountPrice}/month instead of the regular $99/month and save ${savePercentage}%.`;
    }

    return "Choose a plan to continue using Midday.";
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
          After the trial period ends, you'll have read-only access,{" "}
          <Link href="/account/support" className="hover:underline">
            contact us
          </Link>{" "}
          if you have any questions.
        </p>
      </div>
    </div>
  );
}
