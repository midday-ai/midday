import { BlurryCircle } from "@/components/blurry-circle";
import { PostLinks } from "@/components/post-links";
import { PostMeta } from "@/components/post-meta";
import { PostStatus } from "@/components/post-status";
import { fetchPageBlocks, fetchPages } from "@/lib/notion";
import { getStaticParams } from "@/locales/server";
import { NotionRenderer } from "@notion-render/client";
import "@notion-render/client/dist/theme.css";
import format from "date-fns/format";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import Link from "next/link";

export const revalidate = 0;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Updates | Midday",
};

export function generateStaticParams() {
  return getStaticParams();
}

const renderer = new NotionRenderer();

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setStaticParamsLocale(locale);

  const data = await fetchPages();

  const links = data.results.map((post) => ({
    id: post.id,
    lable: format(new Date(post.created_time), "MMMM d, y"),
    slug: post.properties.Slug.url,
  }));

  const posts = data.results.map(async (post, index) => {
    const blocks = await fetchPageBlocks(post.id);
    const html = await renderer.render(...blocks);
    const slug = `/updates/${post.properties.Slug.url}`;

    return (
      <div
        key={post.id}
        className="pt-28 mb-20 -mt-28"
        id={post.properties.Slug.url}
      >
        <PostStatus status={post.properties.Tag.select.name} />

        <Link href={slug}>
          <h2 className="font-medium text-2xl mb-6">
            {post.properties.Title.title.at(0)?.plain_text}
          </h2>
        </Link>

        <div
          className="notion-render"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <PostMeta author={post.properties.Author.people.at(0)} slug={slug} />
      </div>
    );
  });

  return (
    <div className="container max-w-[1140px] flex scroll-smooth">
      <BlurryCircle className="absolute top-[40%] -right-6 bg-[#F59F95]/30 dark:bg-[#F59F95]/10 -z-10 hidden md:block" />
      <BlurryCircle className="absolute top-[70%] right-[30%] bg-[#3633D0]/5 dark:bg-[#3633D0]/10 -z-10 hidden md:block" />

      <PostLinks links={links} />
      <div className="max-w-[680px] pt-[80px] md:pt-[150px] w-full">
        {posts}
      </div>
    </div>
  );
}
