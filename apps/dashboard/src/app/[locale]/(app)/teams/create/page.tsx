import { CreateTeamForm } from "@/components/forms/create-team-form";
import { UserMenu } from "@/components/user-menu";
import { getCurrency } from "@midday/location";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Team | Midday",
};

export default function CreateTeam() {
  const currency = getCurrency();

  return (
    <>
      <header className="w-full absolute left-0 right-0 flex justify-between items-center">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/">
            <Icons.Logo />
          </Link>
        </div>

        <div className="mr-5 mt-4 md:mr-10 md:mt-10">
          <UserMenu onlySignOut />
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[340px] flex-col">
          <div>
            <h1 className="text-2xl font-medium mb-4">Set up your business</h1>
          </div>

          <div className="mb-8">
            <p className="text-sm">
              Tell us a bit about your business to get started. We’ll use this
              info to customize your experience.
            </p>
          </div>

          <CreateTeamForm defaultCurrencyPromise={currency} />
        </div>
      </div>
    </>
  );
}
