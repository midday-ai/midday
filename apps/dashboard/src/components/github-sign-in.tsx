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

export function GithubSignIn({ showLastUsed = false }: Props) {
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

    redirectTo.searchParams.append("provider", "github");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      console.error("[GithubSignIn] OAuth error:", error.message);
      toast({
        duration: 5000,
        variant: "error",
        title: "Sign-in failed",
        description:
          error.message || "Could not connect to GitHub. Please try again.",
      });
      setLoading(false);
      return;
    }

    if (!data?.url) {
      console.error("[GithubSignIn] No redirect URL returned from OAuth");
      toast({
        duration: 5000,
        variant: "error",
        title: "Sign-in failed",
        description:
          "GitHub sign-in is not available. Please try another method.",
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
        className="w-full bg-transparent border border-[#0e0e0e] dark:border-border text-[#0e0e0e] dark:text-foreground font-sans text-sm h-[40px] px-6 py-4 hover:bg-[#0e0e0e]/5 dark:hover:bg-border/10 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-2">
          <Icons.Github size={16} />
          <span>Continue with Github</span>
        </div>
      </SubmitButton>
      {/* Last used pill */}
      {showLastUsed && (
        <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
          <span className="font-sans text-sm text-muted-foreground/50">
            Last used
          </span>
        </div>
      )}
    </div>
  );
}
