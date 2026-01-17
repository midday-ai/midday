import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "The latest updates and improvements to Midday. See what we've been building to help you manage your business finances better.",
};

export default function UpdatesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-4xl mb-4">Updates</h1>
        <p className="text-muted-foreground">Page coming soon</p>
      </div>
    </div>
  );
}
