import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Assistant } from "@/components/assistant";

const title = "AI Assistant";
const description =
  "Your AI-powered financial assistant. Ask questions about your business and get clear, actionable answers based on your real financial data.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/assistant`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/assistant`,
  },
};

export default function Page() {
  return <Assistant />;
}
