import { SupportForm } from "@/components/support-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with abacus. Contact our team for assistance with any questions or issues you may have.",
};

export default function SupportPage() {
  return <SupportForm />;
}
