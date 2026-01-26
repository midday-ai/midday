import { BankCoverage } from "@/components/bank-coverage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Coverage",
  description:
    "We currently support over 25,000+ banks worldwide. Search to find your bank and connect your accounts to abacus.",
};

export default function CoveragePage() {
  return <BankCoverage />;
}
