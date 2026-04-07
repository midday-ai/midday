import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "About Midday. Learn more about the team and company behind your AI-powered business assistant.",
  path: "/about",
  og: {
    title: "About Midday",
    description: "The team behind your business stack",
  },
});

export default function AboutPage() {
  return <div>AboutPage</div>;
}
