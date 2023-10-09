"use client";

import { createClientComponentClient } from "@midday/supabase";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function GoogleSignIn() {
  const supabase = createClientComponentClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <Button
      onClick={handleSignIn}
      className="active:scale-[0.98] rounded-xl bg-white px-6 py-4 text-black font-medium flex space-x-2"
    >
      <Icons.Google />
      <span>Continue with Google</span>
    </Button>
  );
}
