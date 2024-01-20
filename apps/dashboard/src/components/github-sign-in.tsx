"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function GithubSignIn() {
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    setLoading(true);

    if (isDesktopApp()) {
      const redirectTo = new URL("/api/auth/callback", location.origin);

      redirectTo.searchParams.append("provider", "github");
      redirectTo.searchParams.append("client", "desktop");

      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            client: "desktop",
          },
        },
      });
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${location.origin}/api/auth/callback?provider=github`,
        },
      });
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="active:scale-[0.98] rounded-xl bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Icons.Github />
          <span>Continue with Github</span>
        </>
      )}
    </Button>
  );
}
