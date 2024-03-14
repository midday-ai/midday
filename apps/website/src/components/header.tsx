"use client";

import { useI18n } from "@/locales/client";
import { cn } from "@midday/ui/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoIcon } from "./logo-icon";

const links = [
  {
    path: "/pricing",
    name: "pricing",
  },
  {
    path: "/story",
    name: "story",
  },
  {
    path: "/updates",
    name: "updates",
  },
  {
    path: "https://app.midday.ai",
    name: "signIn",
  },
];

export function Header() {
  const t = useI18n();
  const pathname = usePathname();

  const lastPath = `/${pathname.split("/").pop()}`;

  return (
    <header className="h-12 sticky flex items-center justify-center mt-4 top-4 z-50">
      <nav className="border p-3 rounded-2xl backdrop-filter backdrop-blur-xl flex items-center bg-[#121212] bg-opacity-80">
        <Link className="mr-10" href="/">
          <LogoIcon />
        </Link>

        <ul className="flex space-x-2 font-medium text-sm mr-8">
          {links.map(({ path, name }) => {
            return (
              <li key={path}>
                <Link
                  href={path}
                  className={cn(
                    "h-8 items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 inline-flex text-secondary-foreground hover:bg-secondary",
                    path === lastPath && "bg-secondary hover:bg-secondary"
                  )}
                >
                  {t(`header.${name}`)}
                </Link>
              </li>
            );
          })}
        </ul>

        <a
          href="https://app.midday.ai"
          className="h-8 items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t("header.getStarted")}
        </a>
      </nav>
    </header>
  );
}
