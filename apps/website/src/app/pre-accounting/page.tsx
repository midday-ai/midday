import { PreAccounting } from "@/components/pre-accounting";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Automated Pre-Accounting & Bookkeeping",
  description:
    "Automated bookkeeping that collects transactions, matches receipts, and prepares accountant-ready records. Save hours on manual data entry every month.",
  path: "/pre-accounting",
  og: {
    title: "Pre-Accounting",
    description: "Bookkeeping that prepares itself",
  },
  keywords: [
    "bookkeeping software",
    "small business bookkeeping",
    "automated bookkeeping",
    "pre-accounting",
    "accountant-ready records",
  ],
});

export default function Page() {
  return <PreAccounting />;
}
