import { Download } from "@/components/download";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Download",
  description:
    "Download Midday for Mac. Your business, always one click away. Access your business data directly from your desktop.",
  path: "/download",
  og: {
    title: "Download",
    description: "Midday for Mac — always one click away",
  },
});

export default function Page() {
  return <Download />;
}
