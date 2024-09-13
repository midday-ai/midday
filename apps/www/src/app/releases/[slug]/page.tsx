import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { baseUrl } from "@/app/sitemap";
import { BlurryCircle } from "@/components/blurry-circle";
import { CustomMDX } from "@/components/mdx";
import { PostStatus } from "@/components/post-status";
import { getReleasePosts } from "@/lib/blog";

export async function generateStaticParams() {
  const posts = getReleasePosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}): Promise<Metadata | undefined> {
  const post = getReleasePosts().find((post) => post.slug === params.slug);
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
      url: `${baseUrl}/blog/${post.slug}`,
      images: [
        {
          url: image ?? "",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || ""],
    },
  };
}

export default async function Page({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const post = getReleasePosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container flex flex-col items-center justify-center">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: `${baseUrl}${post.metadata.image}`,
            url: `${baseUrl}/releases/${post.slug}`,
          }),
        }}
      />

      <BlurryCircle className="absolute -right-6 top-[40%] -z-10 hidden bg-[#F59F95]/30 dark:bg-[#F59F95]/10 md:block" />
      <BlurryCircle className="absolute right-[30%] top-[70%] -z-10 hidden bg-[#3633D0]/5 dark:bg-[#3633D0]/10 md:block" />

      <article className="w-full max-w-[680px] pt-[80px] md:pt-[150px]">
        <PostStatus status={post.metadata.tag} />

        <h2 className="mb-6 text-2xl font-medium">{post.metadata.title}</h2>

        <div className="updates">
          {post.metadata.image && (
            <Image
              src={post.metadata.image}
              alt={post.metadata.title}
              width={680}
              height={442}
              className="mb-12 rounded-2xl border"
            />
          )}
          <CustomMDX source={post.content} />
        </div>
      </article>
    </div>
  );
}
