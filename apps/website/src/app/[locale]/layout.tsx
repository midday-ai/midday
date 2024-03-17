import { Footer } from "@/components/footer";
import { FooterCTA } from "@/components/footer-cta";
import { Header } from "@/components/header";
import type { ReactNode } from "react";
import { Provider } from "./provider";

export default function Layout({
  params: { locale },
  children,
}: {
  params: { locale: string };
  children: ReactNode;
}) {
  return (
    <Provider locale={locale}>
      <Header />
      <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
        {children}
      </main>
      <FooterCTA />
      <Footer />
    </Provider>
  );
}
