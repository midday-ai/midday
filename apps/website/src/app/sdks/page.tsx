import { SDKs } from "@/components/sdks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SDKs",
  description:
    "Typed SDKs to build faster with abacus. Integrate abacus into your applications with our official client libraries.",
};

export default function Page() {
  return <SDKs />;
}
