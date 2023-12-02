import { ReactNode } from "react";
import { Provider } from "./provider";

export default function Layout({
  params: { locale },
  children,
}: {
  params: { locale: string };
  children: ReactNode;
}) {
  return <Provider locale={locale}>{children}</Provider>;
}
