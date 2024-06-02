import type { ReactElement } from "react";
import { Providers } from "./providers";

export default function Layout({
  children,
  params: { locale },
}: {
  children: ReactElement;
  params: { locale: string };
}) {
  return <Providers locale={locale}>{children}</Providers>;
}
