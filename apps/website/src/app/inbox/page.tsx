import { Inbox } from "@/components/inbox";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Automatic Receipt Matching & Management",
  description:
    "Capture receipts and invoices automatically. Match documents to transactions, search your records, and stay organized. Built for small business owners.",
  path: "/inbox",
  og: {
    title: "Inbox",
    description: "Receipts matched to transactions, automatically",
  },
  keywords: [
    "receipt management",
    "receipt scanner",
    "invoice management",
    "document management",
    "expense receipts",
  ],
});

export default function Page() {
  return <Inbox />;
}
