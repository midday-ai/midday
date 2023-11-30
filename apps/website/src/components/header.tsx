"use client";

import { useScopedI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export function Header() {
  const t = useScopedI18n("header");

  return (
    <header
      className="pt-4 pb-4 md:pt-10 md:pb-5 flex justify-between px-5 lg:px-10  backdrop-filter backdrop-blur-2xl z-[999]"
      style={{ background: "rgba(18, 18, 18,.8)" }}
    >
      <Link href="/" title="Midday">
        <Icons.Logo />
      </Link>

      <Link href="https://app.midday.ai">
        <button
          type="button"
          className="relative rounded-lg overflow-hidden p-[1px]"
          style={{
            background:
              "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
          }}
        >
          <span className="flex items-center gap-4 py-1 px-2 rounded-[7px] bg-background text-white px-8 h-[39px] h-full font-normal">
            {t("signIn")}
          </span>
        </button>
      </Link>
    </header>
  );
}
