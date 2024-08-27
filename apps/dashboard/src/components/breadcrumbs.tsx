"use client";

import { useI18n } from "@/locales/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@midday/ui/breadcrumb";
import { cn } from "@midday/ui/cn";
import Link from "next/link";
import { translatedFolderName } from "./tables/vault/data-table-row";

type Props = {
  folders?: string[];
  hide?: boolean;
};

export function Breadcrumbs({ folders = [], hide }: Props) {
  const t = useI18n();

  const allFolders = ["all", ...folders];

  const links = allFolders?.map((folder, index) => {
    const isLast = folders.length === index;
    const parts = folders.slice(0, index);
    const href =
      folder === "all" ? "/vault" : `/${["vault", ...parts].join("/")}`;

    if (isLast) {
      return (
        <BreadcrumbItem key={folder}>
          <BreadcrumbPage>{translatedFolderName(t, folder)}</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    return (
      <div key={folder} className="flex items-center gap-2">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={href}>{translatedFolderName(t, folder)}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
      </div>
    );
  });

  return (
    <Breadcrumb className={cn("animate-fade-in", hide && "opacity-0")}>
      <BreadcrumbList>{links}</BreadcrumbList>
    </Breadcrumb>
  );
}
