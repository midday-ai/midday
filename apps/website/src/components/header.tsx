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
    path: "/updates",
    name: "updates",
  },
  {
    path: "/story",
    name: "story",
  },
  {
    path: "/download",
    name: "download",
  },
];

export function Header() {
  const t = useI18n();
  const pathname = usePathname();

  const lastPath = `/${pathname.split("/").pop()}`;

  return (
    <header className="h-12 sticky mt-4 top-4 z-50 px-2 md:px-4 md:flex justify-center">
      <nav className="border border-border p-3 rounded-2xl backdrop-filter backdrop-blur-xl flex items-center bg-[#121212] bg-opacity-80">
        <Link className="mr-10" href="/">
          <LogoIcon />
        </Link>

        <ul className="space-x-2 font-medium text-sm mr-8 hidden md:flex">
          {links.map(({ path, name }) => {
            const isActive =
              path === "/updates"
                ? pathname.includes("updates")
                : path === lastPath;

            return (
              <li key={path}>
                <Link
                  href={path}
                  className={cn(
                    "h-8 items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 inline-flex text-secondary-foreground hover:bg-secondary",
                    isActive && "bg-secondary hover:bg-secondary"
                  )}
                >
                  {t(`header.${name}`)}
                </Link>
              </li>
            );
          })}
        </ul>

        <button type="button" className="ml-auto md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={13}
            fill="none"
          >
            <path
              fill="currentColor"
              d="M0 12.195v-2.007h18v2.007H0Zm0-5.017V5.172h18v2.006H0Zm0-5.016V.155h18v2.007H0Z"
            />
          </svg>
        </button>

        <a
          href="https://app.midday.ai"
          className="hidden md:inline-flex h-8 items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t("header.getStarted")}
        </a>
      </nav>
    </header>
  );
}
