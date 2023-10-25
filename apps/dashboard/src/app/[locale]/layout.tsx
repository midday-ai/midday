import { getSupabaseServerClient } from "@midday/supabase/server-client";

const ADMINS = [
  "ec10c095-8cf7-4ba3-a62e-98f2a3d40c4c",
  "7d723617-c2e1-4b71-8bf4-fb02479b264a",
  "efea0311-0786-4f70-9b5a-63e3efa5d319",
];

export default async function Layout({
  dashboard,
  login,
  closed,
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
  closed: React.ReactNode;
}) {
  const supabase = getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session && !ADMINS.includes(session?.user?.id)) {
    return closed;
  }

  return session ? dashboard : login;
}
