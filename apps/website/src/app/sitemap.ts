import { getAllSlugs } from "@/data/apps";
import { getBlogPosts } from "@/lib/blog";
import type { MetadataRoute } from "next";

export const baseUrl = "https://abacuslabs.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date().toISOString().split("T")[0];

  // Static routes
  const staticRoutes = [
    "",
    "/about",
    "/assistant",
    "/bank-coverage",
    "/customers",
    "/download",
    "/file-storage",
    "/inbox",
    "/insights",
    "/integrations",
    "/invoicing",
    "/pre-accounting",
    "/pricing",
    "/privacy",
    "/sdks",
    "/story",
    "/support",
    "/terms",
    "/time-tracking",
    "/transactions",
    "/updates",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
  }));

  // Blog/updates posts
  const blogPosts = getBlogPosts().map((post) => ({
    url: `${baseUrl}/updates/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  // Integration pages
  const integrations = getAllSlugs().map((slug) => ({
    url: `${baseUrl}/integrations/${slug}`,
    lastModified,
  }));

  return [...staticRoutes, ...blogPosts, ...integrations];
}
