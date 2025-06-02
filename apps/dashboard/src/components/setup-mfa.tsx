"use client";

import { EnrollMFA } from "@/components/enroll-mfa";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { useState } from "react";

type Props = {
  setEnroll: (enroll: boolean) => void;
};

function MfaStart({ setEnroll }: Props) {
  return (
    <>
      <div className="flex w-full flex-col relative">
        <div className="pb-4">
          <div className="text-center">
            <h1 className="text-lg mb-2 font-serif">
              Multi-factor authentication
            </h1>
            <p className="text-[#878787] text-sm">
              Add an additional layer of security to your account.
            </p>
          </div>
        </div>

        <div className="pointer-events-auto mt-6 flex flex-col mb-4">
          <Button className="w-full" onClick={() => setEnroll(true)}>
            Generate QR
          </Button>
        </div>
      </div>

      <div className="flex border-t-[1px] pt-4 mt-4 justify-center mb-6">
        <Link href="/" className="text-medium text-sm" prefetch>
          Skip
        </Link>
      </div>

      <p className="text-xs text-[#878787]">
        Generate one-time passwords via authenticator apps like 1Password,
        Authy, etc. as a second factor to verify your identity during sign-in.
      </p>
    </>
  );
}

export function SetupMfa() {
  const [enroll, setEnroll] = useState(false);

  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="https://midday.ai">
          <Icons.LogoSmall />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          {enroll ? <EnrollMFA /> : <MfaStart setEnroll={setEnroll} />}
        </div>
      </div>
    </div>
  );
}
