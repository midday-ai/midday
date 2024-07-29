import { DevMessage } from "@/components/dev-message";
import { Footer } from "@/components/footer";
import { FooterCTA } from "@/components/footer-cta";
import { Header } from "@/components/header";
import { I18nProviderClient } from "@/locales/client";
import { Provider as Analytics } from "@midday/events/client";
import type { ReactNode } from "react";

export default function Layout({
  params: { locale },
  children,
}: {
  params: { locale: string };
  children: ReactNode;
}) {
  return (
    <I18nProviderClient locale={locale}>
      <Header />
      <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
        {children}
      </main>
      <FooterCTA />
      <Footer />
      <Analytics />
      <DevMessage />
    </I18nProviderClient>
  );
}
