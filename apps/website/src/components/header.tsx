"use client";

import { useScopedI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export function Header() {
  const t = useScopedI18n("header");

  return (
    <header className="pt-4 pb-4 md:pt-10 md:pb-5 flex justify-between px-5 lg:px-10">
      <Link href="/" title="Midday">
        <Icons.Logo />
      </Link>

      <Link href="https://app.midday.ai">
        <button
          type="button"
          className="relative rounded-lg overflow-hidden dark:p-[1px] border border-primary dark:border-0 font-semibold text-[14px] h-[40px]"
          style={{
            background:
              "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
          }}
        >
          <span className="flex items-center gap-4 py-1 px-2 rounded-[7px] bg-background text-primary px-8 h-[39px] h-full">
            {t("signIn")}
          </span>
        </button>
      </Link>
    </header>
  );
}
