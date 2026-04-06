import { FileStorage } from "@/components/file-storage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Secure Document Storage for Business",
  description:
    "Store and organize all your business documents in one secure place. Access receipts, contracts, invoices, and files anytime. Built for small business owners.",
  path: "/file-storage",
  og: {
    title: "File Storage",
    description: "All your business documents in one place",
  },
  keywords: [
    "document storage",
    "business file storage",
    "secure document vault",
    "receipt storage",
    "contract management",
  ],
});

export default function Page() {
  return <FileStorage />;
}
