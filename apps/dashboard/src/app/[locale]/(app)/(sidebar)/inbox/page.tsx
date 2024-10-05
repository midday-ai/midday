import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { ContentLayout } from "@/components/panel/content-layout";
import config from "@/config";
import { Cookies } from "@/utils/constants";
import { uniqueCurrencies } from "@midday/location/src/currencies";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: `Inbox | ${config.company}`,
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function InboxPage({ searchParams }: Props) {
  const ascending =
    cookies().get(Cookies.InboxOrder)?.value === "true" ?? false;

  return (
    <ContentLayout title="Inbox">
      <Suspense
        key={ascending.toString()}
        fallback={<InboxViewSkeleton ascending />}
      >
        <Inbox
          ascending={ascending}
          query={searchParams?.q}
          currencies={uniqueCurrencies}
        />
      </Suspense>
    </ContentLayout>
  );
}
