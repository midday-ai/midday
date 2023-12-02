"use client";

import { signOutAction } from "@/actions/sign-out-action";
import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@midday/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOut() {
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    signOutAction();
    router.refresh();
  };

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      {isLoading ? "Loading..." : "Sign out"}
      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
