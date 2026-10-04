"use client";

import { authClient } from "@midday/auth/client";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { toast } from "@midday/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getUrl } from "@/utils/environment";

export type OAuthProvider = "google" | "apple" | "github" | "microsoft";

type ProviderConfig = {
  name: string;
  icon: "Google" | "Apple" | "Github" | "Microsoft";
  scopes?: string;
  queryParams?: Record<string, string>;
  variant: "primary" | "secondary";
  supportsReturnTo: boolean;
};

const OAUTH_PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    name: "Google",
    icon: "Google",
    queryParams: { prompt: "select_account" },
    variant: "secondary",
    supportsReturnTo: true,
  },
  apple: {
    name: "Apple",
    icon: "Apple",
    variant: "secondary",
    supportsReturnTo: false,
  },
  github: {
    name: "Github",
    icon: "Github",
    variant: "secondary",
    supportsReturnTo: true,
  },
  microsoft: {
    name: "Microsoft",
    icon: "Microsoft",
    scopes: "email profile openid",
    variant: "secondary",
    supportsReturnTo: true,
  },
};

export function useLocalOAuthSignIn(provider: OAuthProvider | "azure") {
  const localProvider = provider === "azure" ? "microsoft" : provider;
  const [isLoading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const config = OAUTH_PROVIDERS[localProvider];

  const handleSignIn = async () => {
    if (isDesktopApp()) {
      toast({
        title: "Use email code to sign in on desktop (OAuth coming soon)",
        variant: "error",
      });
      return;
    }
    setLoading(true);
    const callbackURL = new URL("/api/session/post-login", getUrl());
    callbackURL.searchParams.set("provider", localProvider);
    if (returnTo) callbackURL.searchParams.set("return_to", returnTo);
    try {
      const { error } = await authClient.signIn.social({
        provider: localProvider,
        callbackURL: callbackURL.toString(),
        errorCallbackURL: "/login?error=oauth",
      });
      if (error)
        toast({
          title: error.message ?? "Unable to sign in",
          variant: "error",
        });
    } finally {
      setLoading(false);
    }
  };

  return { handleSignIn, isLoading, config };
}
