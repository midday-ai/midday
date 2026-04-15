import { Computer } from "@/components/computer";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Computer — Autonomous AI agents for your business",
  description:
    "Describe what you need, and Midday deploys an autonomous agent that runs on your schedule, learns over time, and delivers results while you sleep.",
  path: "/computer",
  og: {
    title: "Midday Computer",
    description: "Your business runs even when you don't",
  },
  keywords: [
    "autonomous agents",
    "business automation",
    "AI agents",
    "Midday Computer",
    "business workflows",
    "scheduled agents",
  ],
});

export default function Page() {
  return <Computer />;
}
