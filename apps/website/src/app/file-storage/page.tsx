import { FileStorage } from "@/components/file-storage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault",
  description:
    "Store and organize all your important business documents in one secure place. Access receipts, contracts, and files anytime.",
};

export default function Page() {
  return <FileStorage />;
}
