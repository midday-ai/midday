"use client";

import { getUrl } from "@/utils/environment";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { createClient } from "@midday/supabase/client";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  showLastUsed?: boolean;
};

export function GoogleSignIn({ showLastUsed = false }: Props) {
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");

  const handleSignIn = async () => {
    setLoading(true);

    if (isDesktopApp()) {
      const redirectTo = new URL("/api/auth/callback", getUrl());

      redirectTo.searchParams.append("provider", "google");
      redirectTo.searchParams.append("client", "desktop");

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            prompt: "select_account",
            client: "desktop",
          },
        },
      });
    } else {
      const redirectTo = new URL("/api/auth/callback", getUrl());

      if (returnTo) {
        redirectTo.searchParams.append("return_to", returnTo);
      }

      redirectTo.searchParams.append("provider", "google");

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            prompt: "select_account",
          },
        },
      });
    }

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="relative w-full">
      <SubmitButton
        type="button"
        onClick={handleSignIn}
        isSubmitting={isLoading}
        className="w-full bg-[#0e0e0e] dark:bg-white/90 border border-[#0e0e0e] dark:border-white text-white dark:text-[#0e0e0e] font-sans font-medium text-sm h-[40px] px-6 py-4 hover:bg-[#1a1a1a] dark:hover:bg-white transition-colors disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-2">
          <Icons.Google size={16} />
          <span>Continue with Google</span>
        </div>
      </SubmitButton>
      {/* Last used pill */}
      {showLastUsed && (
        <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
          <span className="font-sans text-sm text-white/60 dark:text-[#70707080]">
            Last used
          </span>
        </div>
      )}
    </div>
  );
}
