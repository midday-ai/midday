"use client";

import { createClient } from "@midday/supabase/client";
import { DropdownMenuItem } from "@midday/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOut() {
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);

    await supabase.auth.signOut({
      scope: "local",
    });

    router.push("/login");
  };

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      {isLoading ? "Loading..." : "Sign out"}
    </DropdownMenuItem>
  );
}
