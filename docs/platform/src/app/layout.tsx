import glob from "fast-glob";
import { type Metadata } from "next";

import { Providers } from "@/app/providers";
import { Layout } from "@/components/Layout";
import { type Section } from "@/components/SectionProvider";
import "@midday/ui/globals.css";
import { IntercomScript } from "@midday/ui/intercom-script";
import IntercomWidget from "@midday/ui/intercom-widget";

export const metadata: Metadata = {
  title: {
    template: "%s - Solomon-AI API Reference",
    default: "Solomon-AI API Reference",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let pages = await glob("**/*.mdx", { cwd: "src/app" });
  let allSectionsEntries = (await Promise.all(
    pages.map(async (filename) => [
      "/" + filename.replace(/(^|\/)page\.mdx$/, ""),
      (await import(`./${filename}`)).sections,
    ]),
  )) as Array<[string, Array<Section>]>;
  let allSections = Object.fromEntries(allSectionsEntries);

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="flex min-h-full bg-white antialiased dark:bg-zinc-900">
        <Providers>
          <div className="w-full">
            <Layout allSections={allSections}>
              {children}
              <IntercomWidget
                appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "pezs7zbq"}
              />
              <IntercomScript
                appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID ?? "pezs7zbq"}
              />
            </Layout>
          </div>
        </Providers>
      </body>
    </html>
  );
}
