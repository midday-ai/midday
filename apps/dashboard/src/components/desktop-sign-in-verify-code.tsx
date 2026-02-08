"use client";

import { getDesktopSchemeUrl } from "@midday/desktop-client/platform";
import Image from "next/image";
import appIcon from "public/appicon.png";
import { useEffect, useRef } from "react";

interface DesktopSignInVerifyCodeProps {
  code: string;
}

export function DesktopSignInVerifyCode({
  code,
}: DesktopSignInVerifyCodeProps) {
  const hasRunned = useRef(false);
  const schemeUrl = getDesktopSchemeUrl();

  useEffect(() => {
    if (code && !hasRunned.current) {
      window.location.replace(`${schemeUrl}api/auth/callback?code=${code}`);
      hasRunned.current = true;
    }
  }, [code, schemeUrl]);

  return (
    <div>
      <div className="h-screen flex flex-col items-center justify-center text-center text-sm text-[#606060]">
        <Image
          src={appIcon}
          width={80}
          height={80}
          alt="Midday"
          quality={100}
          className="mb-10"
        />
        <p>Signing in...</p>
        <p className="mb-4">
          If Midday dosen't open in a few seconds,{" "}
          <a
            className="underline"
            href={`${schemeUrl}api/auth/callback?code=${code}`}
          >
            click here
          </a>
          .
        </p>
        <p>You may close this browser tab when done</p>
      </div>
    </div>
  );
}
