import { createClient } from "@midday/supabase/server";
import { Provider } from "./provider";

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

  return <Provider locale={locale}>{session ? dashboard : login}</Provider>;
}
