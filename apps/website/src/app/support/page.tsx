import { SupportForm } from "@/components/support-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Support",
  description:
    "Get help with Midday. Contact our team for assistance with any questions or issues you may have.",
  path: "/support",
  og: { title: "Support", description: "We're here to help" },
});

export default function SupportPage() {
  return <SupportForm />;
}
