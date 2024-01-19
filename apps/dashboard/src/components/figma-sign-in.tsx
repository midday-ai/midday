"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";

export function FigmaSignIn() {
  const supabase = createClient();

  const handleSignIn = async () => {
    if (isDesktopApp()) {
      const redirectTo = new URL("/api/auth/callback", location.origin);

      redirectTo.searchParams.append("provider", "figma");
      redirectTo.searchParams.append("client", "desktop");

      await supabase.auth.signInWithOAuth({
        provider: "figma",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            client: "desktop",
          },
        },
      });
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "figma",
        options: {
          redirectTo: `${location.origin}/api/auth/callback?provider=figma`,
        },
      });
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="active:scale-[0.98] rounded-xl bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
    >
      <Icons.Figma />
      <span>Continue with Figma</span>
    </Button>
  );
}
