import "@/styles/globals.css";
import { cn } from "@midday/ui/cn";
import "@midday/ui/globals.css";
import { getI18n } from "@/locales/server";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactElement } from "react";
import { baseUrl } from "./sitemap";

export const preferredRegion = ["fra1", "sfo1", "iad1"];

// export async function generateMetadata() {
//   const t = await getI18n();

//   return {
//     title: {
//       default: t("metadata.title"),
//       template: "%s | Midday",
//     },
//     description: t("metadata.description"),
//     metadataBase: new URL(baseUrl),
//     openGraph: {
//       title: "Midday | Run your business smarter",
//       description: "This is my portfolio.",
//       url: baseUrl,
//       siteName:
//         "Midday provides you with greater insight into your business and automates the boring tasks, allowing you to focus on what you love to do instead.",
//       locale: "en_US",
//       type: "website",
//       images: [
//         {
//           url: "https://cdn.midday.ai/opengraph-image.jpg",
//           width: 800,
//           height: 600,
//         },
//         {
//           url: "https://cdn.midday.ai/opengraph-image.jpg",
//           width: 1800,
//           height: 1600,
//         },
//       ],
//     },
//     twitter: {
//       title: "Midday | Run your business smarter",
//       description: "This is my portfolio.",
//       images: [
//         {
//           url: "https://cdn.midday.ai/opengraph-image.jpg",
//           width: 800,
//           height: 600,
//         },
//         {
//           url: "https://cdn.midday.ai/opengraph-image.jpg",
//           width: 1800,
//           height: 1600,
//         },
//       ],
//     },
//     robots: {
//       index: true,
//       follow: true,
//       googleBot: {
//         index: true,
//         follow: true,
//         "max-video-preview": -1,
//         "max-image-preview": "large",
//         "max-snippet": -1,
//       },
//     },
//   };
// }

export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)" }],
};

export default function Layout({
  children,
  params: { locale },
}: { children: ReactElement; params: { locale: string } }) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "bg-[#0C0C0C] overflow-x-hidden dark antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
