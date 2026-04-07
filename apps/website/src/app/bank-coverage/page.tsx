import { BankCoverage } from "@/components/bank-coverage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Bank Coverage",
  description:
    "We currently support over 25,000+ banks worldwide. Search to find your bank and connect your accounts to Midday.",
  path: "/bank-coverage",
  og: {
    title: "Bank Coverage",
    description: "Over 25,000 banks supported worldwide",
  },
});

export default function CoveragePage() {
  return <BankCoverage />;
}
