import { PanelsTopLeft } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useSidebarToggle } from "../../hooks/use-sidebar-toggle";
import { useStore } from "../../hooks/use-store";
import { Group } from "../../types/menu";
import { cn } from "../../utils/cn";
import { Button } from "../button";
import { Menu } from "./menu";
import { SidebarToggle } from "./sidebar-toggle";

export interface SidebarProps {
  menu: Group<string>[];
}

export const Sidebar: React.FC<SidebarProps> = ({ menu }) => {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 h-screen -translate-x-full transition-[width] duration-300 ease-in-out lg:translate-x-0",
        sidebar?.isOpen === false ? "w-[90px]" : "w-72",
      )}
    >
      <SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
      <div className="relative flex h-full flex-col overflow-y-auto px-3 py-4 shadow-md dark:shadow-zinc-800">
        <Button
          className={cn(
            "mb-1 transition-transform duration-300 ease-in-out",
            sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0",
          )}
          variant="link"
          asChild
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <PanelsTopLeft className="mr-1 h-6 w-6" />
            <h1
              className={cn(
                "whitespace-nowrap text-lg font-bold transition-[transform,opacity,display] duration-300 ease-in-out",
                sidebar?.isOpen === false
                  ? "hidden -translate-x-96 opacity-0"
                  : "translate-x-0 opacity-100",
              )}
            >
              Brand
            </h1>
          </Link>
        </Button>
        <Menu isOpen={sidebar?.isOpen} menu={menu} />
      </div>
    </aside>
  );
};
