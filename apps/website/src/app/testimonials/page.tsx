import { Testimonials } from "@/components/testimonials";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Customer Stories",
  description:
    "See how solo founders use Midday to run their businesses with less admin.",
  path: "/testimonials",
  og: {
    title: "Customer Stories",
    description: "How founders run their business with Midday",
  },
  keywords: [
    "customer testimonials",
    "user stories",
    "midday reviews",
    "customer success",
    "testimonials",
  ],
});

export default function Page() {
  return <Testimonials />;
}
