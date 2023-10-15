import { getSupabaseServerClient } from "@midday/supabase/server-client";

export default async function Layout({
  dashboard,
  login,
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
}) {
  const supabase = getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session ? dashboard : login;
}
