import { PreAccounting } from "@/components/pre-accounting";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre-accounting Software",
  description:
    "Automated pre-accounting software that collects transactions, matches receipts, and prepares accountant-ready records without manual work.",
};

export default function Page() {
  return <PreAccounting />;
}
