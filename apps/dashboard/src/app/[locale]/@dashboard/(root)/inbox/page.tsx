import { Inbox } from "@/components/inbox";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

export default function InboxPage() {
  return (
    <div className="flex-col flex">
      <Suspense>
        <Inbox />
      </Suspense>
    </div>
  );
}
