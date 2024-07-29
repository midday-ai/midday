import { getBlogPosts } from "@/lib/blog";
import type { MetadataRoute } from "next";

export const baseUrl = "https://midday.ai";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = getBlogPosts().map((post) => ({
    url: `${baseUrl}/en/updates/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  const routes = ["", "/en/updates"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs];
}
