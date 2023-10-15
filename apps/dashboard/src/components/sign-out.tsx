"use client";

import { getSupabaseBrowserClient } from "@midday/supabase/browser-client";
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@midday/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOut() {
  const [isLoading, setLoading] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      {isLoading ? "Loading..." : "Sign out"}
      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
