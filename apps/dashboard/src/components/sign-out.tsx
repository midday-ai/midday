"use client";

import { useI18n } from "@/locales/client";
import { createClient } from "@midday/supabase/client";
import { DropdownMenuItem } from "@midday/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOut() {
  const t = useI18n();
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
    <DropdownMenuItem className="text-xs" onClick={handleSignOut}>
      {isLoading ? t("user_menu.loading") : t("user_menu.sign_out")}
    </DropdownMenuItem>
  );
}
