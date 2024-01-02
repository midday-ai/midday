import { getUser } from "@midday/supabase/cached-queries";
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

  const user = await getUser();

  if (user?.data) {
    content = user?.data.team ? dashboard : teams;
  }

  return <Providers locale={locale}>{content}</Providers>;
}
