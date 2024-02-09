import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Private beta | Midday",
};

export default function Closed() {
  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="https://midday.ai">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="pb-4">
              <h1 className="font-medium pb-1 text-3xl">
                We will soon open up for beta.{" "}
              </h1>
            </div>

            <p className="font-medium pb-1 text-2xl text-[#606060]">
              You can't log in yet, but keep a lookout in your email for when we
              open up for beta testing.
            </p>

            <div className="pointer-events-auto mt-6 flex flex-col mb-4">
              <Link href="https://midday.ai" className="w-full">
                <Button className="w-full">Back to home page</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
