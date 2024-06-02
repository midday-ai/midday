"use client";

import { EnrollMFA } from "@/components/enroll-mfa";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { useState } from "react";

function MfaStart({ setEnroll }) {
  return (
    <>
      <div className="flex w-full flex-col relative">
        <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
          <h1 className="font-medium pb-1 text-3xl">
            Multi-factor <br />
            authentication
          </h1>
        </div>

        <p className="font-medium pb-1 text-2xl text-[#606060]">
          Add an additional layer of security to your account.
        </p>

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

  let content = <MfaStart setEnroll={setEnroll} />;

  if (enroll) {
    content = <EnrollMFA />;
  }

  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="https://midday.ai">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          {content}
        </div>
      </div>
    </div>
  );
}
