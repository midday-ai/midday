import { SDKs } from "@/components/sdks";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "SDKs",
  description:
    "Typed SDKs to build faster with Midday. Integrate Midday into your applications with our official client libraries.",
  path: "/sdks",
  og: {
    title: "SDKs",
    description: "Typed client libraries for the Midday API",
  },
});

export default function Page() {
  return <SDKs />;
}
