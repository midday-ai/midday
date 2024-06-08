import { CreateTeamForm } from "@/components/forms/create-team-form";
import { UserMenu } from "@/components/user-menu";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create Team | Midday",
};

export default async function CreateTeam() {
  return (
    <>
      <header className="w-full absolute left-0 right-0 flex justify-between items-center">
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

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[340px] flex-col">
          <div>
            <h1 className="text-2xl font-medium mb-8">
              What’s the name of your company or team?
            </h1>
          </div>

          <div className="mb-2">
            <p className="text-sm">
              This will be the name of your Midday workspace — choose something
              that your team will recognize.
            </p>
          </div>

          <CreateTeamForm />
        </div>
      </div>
    </>
  );
}
