import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: "https://midday.ai",
      lastModified: new Date(),
    },
  ];
}
