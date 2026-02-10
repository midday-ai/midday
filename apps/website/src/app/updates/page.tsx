import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { baseUrl } from "@/app/sitemap";
import { CustomMDX } from "@/components/mdx";
import { Pagination } from "@/components/pagination";
import { PostStatus } from "@/components/post-status";
import { getBlogPosts } from "@/lib/blog";

const title = "Updates";
const description =
  "The latest updates and improvements to Midday. See what we've been building to help you manage your business finances better.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/updates`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/updates`,
  },
};

// Force static generation
export const dynamic = "force-static";

const POSTS_PER_PAGE = 3;

export default function UpdatesPage() {
  const allPosts = getBlogPosts().sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  });

  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const posts = allPosts.slice(0, POSTS_PER_PAGE);

  return (
    <div className="container flex flex-col items-center">
      <div className="max-w-[680px] pt-[80px] md:pt-[150px] w-full">
        {posts.map((post) => (
          <article key={post.slug} className="mb-20">
            <PostStatus status={post.metadata.tag} />

            <Link className="mb-6 block" href={`/updates/${post.slug}`}>
              <h2 className="font-medium text-2xl mb-6">
                {post.metadata.title}
              </h2>
            </Link>

            <div className="updates">
              {post.metadata.image && (
                <Image
                  src={post.metadata.image}
                  alt={post.metadata.title}
                  width={680}
                  height={442}
                  className="mb-12"
                />
              )}

              <CustomMDX source={post.content} />
            </div>
          </article>
        ))}

        <Pagination
          currentPage={1}
          totalPages={totalPages}
          basePath="/updates"
        />
      </div>
    </div>
  );
}
