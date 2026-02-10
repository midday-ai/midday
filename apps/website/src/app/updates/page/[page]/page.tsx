import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { baseUrl } from "@/app/sitemap";
import { CustomMDX } from "@/components/mdx";
import { Pagination } from "@/components/pagination";
import { PostStatus } from "@/components/post-status";
import { getBlogPosts } from "@/lib/blog";

const POSTS_PER_PAGE = 3;

export async function generateStaticParams() {
  const posts = getBlogPosts();
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  // Generate pages 2 onwards (page 1 is handled by /updates)
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

type Props = {
  params: Promise<{ page: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const title = `Updates - Page ${page}`;
  const description =
    "The latest updates and improvements to Midday. See what we've been building to help you manage your business finances better.";
  const url = `${baseUrl}/updates/page/${page}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function UpdatesPagePaginated({ params }: Props) {
  const { page } = await params;
  const currentPage = Number.parseInt(page, 10);

  // Redirect page 1 to /updates
  if (currentPage === 1) {
    redirect("/updates");
  }

  const allPosts = getBlogPosts().sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  });

  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

  // 404 for invalid pages
  if (currentPage < 1 || currentPage > totalPages) {
    notFound();
  }

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

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
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/updates"
        />
      </div>
    </div>
  );
}
