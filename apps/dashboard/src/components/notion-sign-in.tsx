"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useSearchParams } from "next/navigation";

export function NotionSignIn() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");

  const handleSignIn = async () => {
    if (isDesktopApp()) {
      const redirectTo = new URL("/api/auth/callback", location.origin);

      redirectTo.searchParams.append("provider", "notion");
      redirectTo.searchParams.append("client", "desktop");

      await supabase.auth.signInWithOAuth({
        provider: "notion",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            client: "desktop",
          },
        },
      });
    } else {
      const redirectTo = new URL("/api/auth/callback", location.origin);

      if (returnTo) {
        redirectTo.searchParams.append("return_to", returnTo);
      }

      redirectTo.searchParams.append("provider", "notion");

      await supabase.auth.signInWithOAuth({
        provider: "notion",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="active:scale-[0.98] rounded-xl bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
    >
      <Icons.Notion />
      <span>Continue with Notion</span>
    </Button>
  );
}
