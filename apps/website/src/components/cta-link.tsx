"use client";

import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export function CtaLink({ text }: { text: string }) {
  return (
    <Link
      href="https://app.midday.ai"
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium text-sm flex items-center space-x-2"
    >
      <span>{text}</span>
      <Icons.ArrowOutward />
    </Link>
  );
}
