"use client";

import { createClientComponentClient } from "@midday/supabase";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export function SignOut(props: ComponentProps<"button">) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <button onClick={handleSignOut} type="button" className="text-white">
      Sign out
    </button>
  );
}
