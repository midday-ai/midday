import { InviteForm } from "@/components/forms/invite-form";
import { UserMenu } from "@/components/user-menu";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
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

      <div className="flex min-h-screen items-center justify-center overflow-hidden p-6 md:p-0">
        <div className="m-auto flex flex-col">
          <main className="relative flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32">
              <div className="container space-y-10 px-4 md:px-6 xl:space-y-16">
                <div className="mx-auto grid max-w-[1300px] gap-4 px-4 sm:px-6 md:grid-cols-2 md:gap-16 md:px-10">
                  <div className="flex flex-col gap-3">
                    <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                      Invite Team Members
                    </h1>
                    <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                      Invite new members by email address to your workspace
                    </p>
                    <div className="mt-6">
                      <Link href="/">
                        <Button className="inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                          Skip this step
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-col items-start space-y-4">
                    <Card className="w-full p-6 sm:p-8">
                      <CardHeader>
                        <CardTitle>Invite new members</CardTitle>
                        <CardDescription>
                          Add the email addresses of the people you want on your
                          team and send them invites to join.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <InviteForm />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
