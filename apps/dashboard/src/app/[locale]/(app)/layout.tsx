import { SetUserIdServerComponent } from "@logsnag/next";
import { createClient } from "@midday/supabase/server";

export default async function Layout({
  dashboard,
  login,
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <>
        {dashboard}
        {!process.env.NEXT_PUBLIC_LOGSNAG_DISABLED && (
          <SetUserIdServerComponent userId={user.id} />
        )}
      </>
    );
  }

  return login;
}
