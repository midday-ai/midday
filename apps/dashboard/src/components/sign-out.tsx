"use client";

import { authClient } from "@midday/auth/client";
import { createClient } from "@midday/supabase/client";
import { DropdownMenuItem } from "@midday/ui/dropdown-menu";
import { isLocalBackend } from "@midday/utils/backend";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAccessToken } from "@/utils/session";

export function SignOut() {
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);

    clearAccessToken();
    if (isLocalBackend()) await authClient.signOut();
    else await createClient().auth.signOut({ scope: "local" });

    router.push("/login");
  };

  return (
    <DropdownMenuItem
      className="text-xs"
      data-track="User Signed Out"
      onClick={handleSignOut}
    >
      {isLoading ? "Loading..." : "Sign out"}
    </DropdownMenuItem>
  );
}
