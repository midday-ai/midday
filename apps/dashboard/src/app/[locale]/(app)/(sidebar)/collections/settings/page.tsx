import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionsSettingsTabs } from "@/components/collections/settings/collections-settings-tabs";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Collections Settings | Abacus",
};

export default function CollectionsSettingsPage() {
  return (
    <div className="max-w-[800px] p-6">
      <Link
        href="/collections"
        className="inline-flex items-center gap-1 text-sm text-[#606060] hover:text-primary transition-colors mb-6"
      >
        &larr; Back to Collections
      </Link>
      <Suspense>
        <CollectionsSettingsTabs />
      </Suspense>
    </div>
  );
}
