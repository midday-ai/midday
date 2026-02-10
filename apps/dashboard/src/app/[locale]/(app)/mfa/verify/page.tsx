"use client";

import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { VerifyMfa } from "@/components/verify-mfa";

export default function Verify() {
  return (
    <div>
      <div className="absolute left-4 top-4">
        <Link href="https://midday.ai">
          <Icons.LogoSmall className="h-6 w-auto" />
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
