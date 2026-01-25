"use client";

import { getUrl } from "@/utils/environment";
import { createClient } from "@midday/supabase/client";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
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
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);

    const redirectTo = new URL("/api/auth/callback", getUrl());

    if (returnTo) {
      redirectTo.searchParams.append("return_to", returnTo);
    }

    redirectTo.searchParams.append("provider", "google");

    console.log("[GoogleSignIn] Calling signInWithOAuth with redirectTo:", redirectTo.toString());

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    console.log("[GoogleSignIn] OAuth response:", { data, error });

    if (error) {
      console.error("[GoogleSignIn] OAuth error:", error.message);
      toast({
        duration: 5000,
        variant: "error",
        title: "Sign-in failed",
        description:
          error.message || "Could not connect to Google. Please try again.",
      });
      setLoading(false);
      return;
    }

    if (!data?.url) {
      console.error("[GoogleSignIn] No redirect URL returned from OAuth");
      toast({
        duration: 5000,
        variant: "error",
        title: "Sign-in failed",
        description:
          "Google sign-in is not available. Please try another method.",
      });
      setLoading(false);
      return;
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
