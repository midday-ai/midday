import { createClient } from "@midday/supabase/server";
import { Provider } from "./provider";

const ADMINS = [
  "ec10c095-8cf7-4ba3-a62e-98f2a3d40c4c",
  "7d723617-c2e1-4b71-8bf4-fb02479b264a",
  "efea0311-0786-4f70-9b5a-63e3efa5d319",
  "2f76981b-fc66-479c-8203-521a5a1f734a",
  "3cb7ad12-907e-49c6-9f3a-ea3eeb1d34cf",
  "71908de2-2727-43a8-8a3f-4ae203faa4c5",
];

export default async function Layout({
  dashboard,
  login,
  closed,
  params: { locale },
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
  closed: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session && !ADMINS.includes(session?.user?.id)) {
    return closed;
  }

  return <Provider locale={locale}>{session ? dashboard : login}</Provider>;
}
