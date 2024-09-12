import { InviteForm } from "@/components/forms/invite-form";
import { UserMenu } from "@/components/user-menu";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Invite Team Member | Midday",
};

export default async function InviteMembers() {
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
          <h1 className="text-2xl font-medium pb-4">Invite team members</h1>
          <p className="text-sm text-[#878787] mb-8">
            Add the email addresses of the people you want on your team and send
            them invites to join.
          </p>

          <InviteForm />
        </div>
      </div>
    </>
  );
}
