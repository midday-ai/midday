import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { SDKs } from "@/components/sdks";

const title = "SDKs";
const description =
  "Typed SDKs to build faster with Midday. Integrate Midday into your applications with our official client libraries.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/sdks`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/sdks`,
  },
};

export default function Page() {
  return <SDKs />;
}
