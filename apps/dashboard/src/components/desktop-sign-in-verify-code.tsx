"use client";

import Image from "next/image";
import appIcon from "public/appicon.png";
import { useEffect, useRef } from "react";

export function DesktopSignInVerifyCode({ code }) {
  const isRunned = useRef(false);

  useEffect(() => {
    if (code && !isRunned.current) {
      window.location.replace(`midday://api/auth/callback?code=${code}`);
      isRunned.current = true;
    }
  }, [code]);

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
            href={`midday://api/auth/callback?code=${code}`}
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
