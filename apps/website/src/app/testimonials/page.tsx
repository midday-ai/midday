import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Testimonials } from "@/components/testimonials";

const title = "Customer Stories";
const description =
  "See how founders and small teams use Midday to manage their finances and run their businesses.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "customer testimonials",
    "user stories",
    "midday reviews",
    "customer success",
    "testimonials",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/testimonials`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/testimonials`,
  },
};

export default function Page() {
  return <Testimonials />;
}
