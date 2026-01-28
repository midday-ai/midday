"use client";

import { getUrl } from "@/utils/environment";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { createClient } from "@midday/supabase/client";
import type { Provider } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export type OAuthProvider = "google" | "apple" | "github" | "azure";

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
  azure: {
    name: "Microsoft",
    icon: "Microsoft",
    scopes: "email profile openid",
    variant: "secondary",
    supportsReturnTo: true,
  },
};

export function useOAuthSignIn(provider: OAuthProvider) {
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const config = OAUTH_PROVIDERS[provider];

  const handleSignIn = async () => {
    setLoading(true);

    const redirectTo = new URL("/api/auth/callback", getUrl());
    redirectTo.searchParams.append("provider", provider);

    if (isDesktopApp()) {
      redirectTo.searchParams.append("client", "desktop");

      await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: redirectTo.toString(),
          scopes: config.scopes,
          queryParams: {
            ...config.queryParams,
            client: "desktop",
          },
        },
      });
    } else {
      if (config.supportsReturnTo && returnTo) {
        redirectTo.searchParams.append("return_to", returnTo);
      }

      await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: redirectTo.toString(),
          scopes: config.scopes,
          queryParams: config.queryParams,
        },
      });
    }

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return { handleSignIn, isLoading, config };
}
