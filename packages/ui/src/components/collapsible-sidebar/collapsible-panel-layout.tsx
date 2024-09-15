"use client";

import * as React from "react";
import { useSidebarToggle } from "../../hooks/use-sidebar-toggle";
import { useStore } from "../../hooks/use-store";
import { Group } from "../../types/menu";
import { cn } from "../../utils/cn";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";

export default function CollapsiblePanelLayout({
  children,
  menu,
  footerMessage,
}: {
  children: React.ReactNode;
  menu: Group<string>[];
  footerMessage: string;
}) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <>
      <Sidebar menu={menu} />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-zinc-50 transition-[margin-left] duration-300 ease-in-out dark:bg-zinc-900",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "transition-[margin-left] duration-300 ease-in-out",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        <Footer description={footerMessage} />
      </footer>
    </>
  );
}
