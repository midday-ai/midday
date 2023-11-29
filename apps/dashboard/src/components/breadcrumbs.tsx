"use client";

import { useI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { translatedFolderName } from "./tables/vault/data-table-row";

export function Breadcrumbs({ folders = [] }) {
  const t = useI18n();

  const allFolders = ["all", ...folders];

  const links = allFolders?.map((folder, index) => {
    const isLast = folders.length === index;
    const href = folder === "all" ? "/vault" : `/vault/${folder}`;

    return (
      <div className="flex items-center" key={folder}>
        <Link href={href} className="max-w-[100px] truncate">
          <span key={folder}>{translatedFolderName(t, folder)}</span>
        </Link>

        {folders.length > 0 && !isLast && (
          <Icons.ArrowRight className="text-[#878787] mx-1" size={16} />
        )}
      </div>
    );
  });

  return <div className="flex">{links}</div>;
}
