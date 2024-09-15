"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { type Section, SectionProvider } from "@/components/SectionProvider";
import { Icons } from "@midday/ui/icons";

export function Layout({
  children,
  allSections,
}: {
  children: React.ReactNode;
  allSections: Record<string, Array<Section>>;
}) {
  let pathname = usePathname();

  return (
    <SectionProvider sections={allSections[pathname] ?? []}>
      <div className="h-full lg:ml-72 xl:ml-80">
        <motion.header
          layoutScroll
          className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex"
        >
          <div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pb-8 lg:pt-4 lg:dark:border-white/10 xl:w-80">
            <div className="hidden lg:flex">
              <Link href="/" aria-label="Home" className="flex flex-1 gap-1">
                <Icons.Logo className="text-bold h-8 text-foreground" />
                <p className="text-xl font-bold text-foreground">Solomon AI</p>
              </Link>
            </div>
            <Header />
            <Navigation className="hidden lg:mt-10 lg:block" />
          </div>
        </motion.header>
        <div className="relative flex h-full flex-col px-4 pt-14 sm:px-6 lg:px-8">
          <main className="flex-auto">{children}</main>
          <Footer />
        </div>
      </div>
    </SectionProvider>
  );
}
