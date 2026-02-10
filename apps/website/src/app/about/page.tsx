import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";

const title = "About";
const description =
  "About Midday. Learn more about the team and company behind your AI-powered business assistant.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/about`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  return <div>AboutPage</div>;
}
