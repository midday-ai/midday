"use client";

import { VerifyMfa } from "@/components/verify-mfa";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export default function Verify() {
  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="https://midday.ai">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <VerifyMfa />
        </div>
      </div>
    </div>
  );
}
