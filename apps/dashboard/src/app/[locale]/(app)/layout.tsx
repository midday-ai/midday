import { SetUserIdServerComponent } from "@logsnag/next";
import { createClient } from "@midday/supabase/server";
import { Providers } from "../providers";

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
