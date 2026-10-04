"use client";

import { isDesktopApp } from "@midday/desktop-client/platform";
import { createClient } from "@midday/supabase/client";
import { isLocalBackend } from "@midday/utils/backend";
import type { Provider } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getUrl } from "@/utils/environment";
import { useLocalOAuthSignIn } from "./use-oauth-sign-in.local";

export type OAuthProvider =
  | "google"
  | "apple"
  | "github"
  | "azure"
  | "microsoft";

type ProviderConfig = {
  name: string;
  icon: "Google" | "Apple" | "Github" | "Microsoft";
  scopes?: string;
  queryParams?: Record<string, string>;
  variant: "primary" | "secondary";
  supportsReturnTo: boolean;
};

const OAUTH_PROVIDERS: Record<
  Exclude<OAuthProvider, "microsoft">,
  ProviderConfig
> = {
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

function useSupabaseOAuthSignIn(provider: OAuthProvider) {
  const supabaseProvider = provider === "microsoft" ? "azure" : provider;
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const config = OAUTH_PROVIDERS[supabaseProvider];

  const handleSignIn = async () => {
    setLoading(true);

    const redirectTo = new URL("/api/auth/callback", getUrl());
    redirectTo.searchParams.append("provider", supabaseProvider);

    const isDesktop = isDesktopApp();

    if (isDesktop) {
      redirectTo.searchParams.append("client", "desktop");
    } else if (config.supportsReturnTo && returnTo) {
      redirectTo.searchParams.append("return_to", returnTo);
    }

    const queryParams = isDesktop
      ? { ...config.queryParams, client: "desktop" }
      : config.queryParams;

    await supabase.auth.signInWithOAuth({
      provider: supabaseProvider as Provider,
      options: {
        redirectTo: redirectTo.toString(),
        scopes: config.scopes,
        queryParams,
      },
    });

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return { handleSignIn, isLoading, config };
}

// The backend is fixed for the lifetime of a browser build; select the hook before rendering.
export const useOAuthSignIn = isLocalBackend()
  ? useLocalOAuthSignIn
  : useSupabaseOAuthSignIn;
