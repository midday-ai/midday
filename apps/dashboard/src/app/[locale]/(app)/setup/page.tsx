import { SetupForm } from "@/components/setup-form";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Setup account | Midday",
};

export default function Page() {
  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="/">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
            <h1 className="font-medium pb-1 text-3xl">Setup your account.</h1>
          </div>

          <SetupForm />
        </div>
      </div>
    </div>
  );
}
