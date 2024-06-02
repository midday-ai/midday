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
import Link from "next/link";
import { translatedFolderName } from "./tables/vault/data-table-row";

export function Breadcrumbs({ folders = [] }) {
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
      <div key={folder}>
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
    <Breadcrumb>
      <BreadcrumbList>{links}</BreadcrumbList>
    </Breadcrumb>
  );
}
