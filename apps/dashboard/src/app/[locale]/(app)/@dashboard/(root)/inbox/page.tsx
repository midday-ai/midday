import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

export default async function InboxPage({ searchParams }) {
  const ascending =
    cookies().get(Cookies.InboxOrder)?.value === "true" ?? false;

  console.log(searchParams?.q);
  return (
    <Suspense
      fallback={<InboxViewSkeleton key={ascending.toString()} ascending />}
    >
      <Inbox ascending={ascending} query={searchParams?.q} />
    </Suspense>
  );
}
