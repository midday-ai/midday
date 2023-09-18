import Link from "next/link";
import { getI18n } from "@/locales/server";
import type { Session } from "@supabase/auth-helpers-nextjs";

import SingOut from "./SignOut";

export default async function UserMenu({
  session,
}: {
  session: Session | null;
}) {
  const t = await getI18n();

  return session ? (
    <div>
      <SingOut buttonText={t("userMenu.logout")} />
    </div>
  ) : (
    <Link href="/login" className="text-xs text-black">
      {t("userMenu.login")}
    </Link>
  );
}
