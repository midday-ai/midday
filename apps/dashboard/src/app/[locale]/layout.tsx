import { Providers } from "./providers";

export default function Layout({
  children,
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <Providers locale={locale}>{children}</Providers>;
}
