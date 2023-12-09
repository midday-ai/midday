import { createClient } from "@midday/supabase/server";
import { Providers } from "./providers";

export default async function Layout({
  dashboard,
  login,
  params: { locale },
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return <Providers locale={locale}>{session ? dashboard : login}</Providers>;
}
