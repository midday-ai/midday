import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { baseUrl } from "@/app/sitemap";
import { CustomMDX } from "@/components/mdx";
import { PostAuthor } from "@/components/post-author";
import { getBlogPosts } from "@/lib/blog";

// Force static generation
export const dynamic = "force-static";

export async function generateStaticParams() {
  const posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    return;
  }

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${baseUrl}/updates/${post.slug}`,
      images: image
        ? [
            {
              url: image,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.metadata.title,
    datePublished: post.metadata.publishedAt,
    dateModified: post.metadata.publishedAt,
    description: post.metadata.summary,
    image: post.metadata.image ? `${baseUrl}${post.metadata.image}` : undefined,
    url: `${baseUrl}/updates/${post.slug}`,
  };

  return (
    <div className="container max-w-[1140px] flex justify-center">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="max-w-[680px] pt-[80px] md:pt-[150px] w-full pb-24">
        <Link
          href="/updates"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block"
        >
          ← Go back
        </Link>

        <h2 className="font-medium text-2xl mb-6">{post.metadata.title}</h2>

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

        <div className="mt-10">
          <PostAuthor author="pontus" />
        </div>
      </article>
    </div>
  );
}
