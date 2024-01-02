import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { Providers } from "./providers";

export default async function Layout({
  dashboard,
  login,
  teams,
  params: { locale },
}: {
  dashboard: React.ReactNode;
  login: React.ReactNode;
  teams: React.ReactNode;
  params: { locale: string };
}) {
  let content = login;

  const { data } = await getUser();

  if (data) {
    content = data.team ? dashboard : teams;
  }

  return <Providers locale={locale}>{content}</Providers>;
}
