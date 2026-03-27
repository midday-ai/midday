import { GeistPixelLine } from "geist/font/pixel";
import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { Agents } from "@/components/agents";

const title = "Agents — Let agents run your business";
const description =
  "Midday CLI and MCP server let AI agents create invoices, reconcile transactions, track time, and manage your finances from any tool.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "agent native cli",
    "business infrastructure for agents",
    "MCP",
    "Midday CLI",
    "finance operations",
    "business automation",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/agents`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/agents`,
  },
};

export default function Page() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root, .dark {
              --background: 225, 70%, 22% !important;
              --foreground: 0, 0%, 100% !important;
              --muted-foreground: 225, 60%, 75% !important;
              --border: 225, 50%, 35% !important;
              --primary: 0, 0%, 100% !important;
              --primary-foreground: 225, 70%, 22% !important;
              --muted: 225, 60%, 18% !important;
              --secondary: 225, 70%, 22% !important;
              --secondary-foreground: 0, 0%, 100% !important;
            }
            footer img,
            footer svg {
              filter: sepia(0.4) hue-rotate(180deg) saturate(1.5) brightness(0.9);
            }
            img[src*="accounting-"],
            img[src*="header-dock-"] {
              filter: sepia(0.6) hue-rotate(180deg) saturate(2) brightness(0.9);
            }
            footer button[aria-label="Toggle theme"] {
              display: none;
            }
          `,
        }}
      />
      <Agents pixelFontClass={GeistPixelLine.className} />
    </>
  );
}
