import { UserMenu } from "@/components/user-menu";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FaXTwitter } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Early access | Midday",
};

export default function Closed() {
  return (
    <div>
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
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="pb-4">
              <h1 className="font-medium pb-1 text-3xl">
                Thank you for requesting early access.
              </h1>
            </div>

            <p className="font-medium pb-1 text-2xl text-[#606060]">
              We are currently in private beta, but we send out new invites
              daily. You can follow us on X for the latest updates.
            </p>

            <div className="pointer-events-auto mt-6 flex flex-col mb-4 space-y-4">
              <a href="https://twitter.com/middayai">
                <Button className="w-full flex items-center space-x-2 h-10">
                  <>
                    <span>Follow us on</span>
                    <FaXTwitter />
                  </>
                </Button>
              </a>

              <Link href="https://midday.ai" className="w-full">
                <Button className="w-full h-10" variant="outline">
                  Back to home page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
