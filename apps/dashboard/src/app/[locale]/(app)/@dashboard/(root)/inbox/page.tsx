import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function InboxPage({ searchParams }: Props) {
  const ascending =
    cookies().get(Cookies.InboxOrder)?.value === "true" ?? false;

  return (
    <Suspense
      fallback={<InboxViewSkeleton key={ascending.toString()} ascending />}
    >
      <Inbox ascending={ascending} query={searchParams?.q} />
    </Suspense>
  );
}
