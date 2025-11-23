import { Plans } from "@/components/plans";
import { OpenURL } from "./open-url";

type UpgradeContentProps = {
  user: {
    fullName: string | null;
  };
};

export function UpgradeContent({ user }: UpgradeContentProps) {
  const firstName = user.fullName ? user.fullName.split(" ").at(0) : "";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] md:py-12 md:-ml-8">
      <div className="w-full max-w-[696px] p-8">
        <div className="mb-8 md:mt-8">
          <h1 className="text-xl font-semibold leading-none tracking-tight mb-2">
            Unlock full access to Midday
          </h1>
          <p className="text-sm text-muted-foreground">
            {firstName ? `Hi ${firstName}, ` : ""}You've been using Midday for
            14 days. Your trial has ended—choose a plan to continue using all of
            Midday's features.
          </p>
        </div>

        <Plans />

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Questions?{" "}
          <a href="/account/support" className="hover:underline">
            Contact support
          </a>
          {" or "}
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
