"use client";

import { getUrl } from "@/utils/environment";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { createClient } from "@midday/supabase/client";
import { useToast } from "@midday/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type OAuthProvider = "apple" | "github" | "google";

interface OAuthOptions {
  provider: OAuthProvider;
  useReturnTo?: boolean;
  extraQueryParams?: Record<string, string>;
}

interface OAuthSignInResult {
  isLoading: boolean;
  signIn: () => Promise<void>;
}

export function useOAuthSignIn(options: OAuthOptions): OAuthSignInResult {
  const { provider, useReturnTo = false, extraQueryParams = {} } = options;
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const { toast } = useToast();

  const signIn = async () => {
    const startTime = performance.now();
    setLoading(true);

    try {
      const redirectTo = new URL("/api/auth/callback", getUrl());
      
      // Add provider to redirect URL
      redirectTo.searchParams.append("provider", provider);

      // Handle returnTo parameter for supported providers
      if (useReturnTo && returnTo) {
        redirectTo.searchParams.append("return_to", returnTo);
      }

      // Desktop-specific configuration
      if (isDesktopApp()) {
        redirectTo.searchParams.append("client", "desktop");
      }

      // Prepare OAuth options
      const oauthOptions: any = {
        redirectTo: redirectTo.toString(),
        queryParams: {
          ...extraQueryParams,
          ...(isDesktopApp() && { client: "desktop" }),
        },
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });

      if (error) {
        console.error(`${provider} OAuth sign-in failed`, error, {
          action: "oauth_signin_failed",
          provider,
          errorMessage: error.message,
          isDesktop: isDesktopApp(),
        });

        toast({
          title: "Sign-in Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      console.error(`${provider} OAuth sign-in exception`, error as Error, {
        action: "oauth_signin_exception",
        provider,
        errorMessage,
        isDesktop: isDesktopApp(),
      });

      toast({
        title: "Sign-in Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Reset loading state after OAuth redirect delay
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  return {
    isLoading,
    signIn,
  };
}