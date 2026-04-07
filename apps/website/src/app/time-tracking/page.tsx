import { TimeTracking } from "@/components/time-tracking";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Time Tracking for Freelancers & Consultants",
  description:
    "Track billable hours with ease. Get monthly breakdowns, link time to projects and customers, and generate invoices. Built for consultants and small business owners.",
  path: "/time-tracking",
  og: {
    title: "Time Tracking",
    description: "Billable hours, monthly breakdowns, and invoices",
  },
  keywords: [
    "time tracking",
    "billable hours",
    "time tracker",
    "project time tracking",
    "small business time management",
  ],
});

export default function Page() {
  return <TimeTracking />;
}
