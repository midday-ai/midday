import { SetUserIdServerComponent } from "@logsnag/next";
import { createClient } from "@midday/supabase/server";
import { Providers } from "../providers";

// NOTE: GoCardLess serverAction needs this currently
// (Fetch accounts takes up to 20s and default limit is 15s)
export const maxDuration = 30;

export default async function Layout({
  dashboard,
  login,
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return (
      <>
        {dashboard}
        <SetUserIdServerComponent userId={session.user.id} />
      </>
    );
  }

  return login;
}
