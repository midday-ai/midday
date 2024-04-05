import { BlurryCircle } from "@/components/blurry-circle";
import { PostMeta } from "@/components/post-meta";
import { PostStatus } from "@/components/post-status";
import {
  fetchPageBlocks,
  fetchPageBySlug,
  fetchPages,
  imageRenderer,
} from "@/lib/notion";
import { NotionRenderer } from "@notion-render/client";
import "@notion-render/client/dist/theme.css";
import { format } from "date-fns";
import Link from "next/link";

export const revalidate = 0;

export async function generateStaticParams() {
  const data = await fetchPages();

  return data.results.map((post) => ({
    slug: post.properties.Slug.url,
  }));
}

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const post = await fetchPageBySlug(slug);
  const blocks = await fetchPageBlocks(post.id);

  const firstImage = blocks.find((block) => block.type === "image");

  return {
    title: `Midday | ${post.properties.Title.title.at(0)?.plain_text}`,
    openGraph: {
      images: [firstImage?.image?.file?.url],
    },
  };
}

const renderer = new NotionRenderer({
  renderers: [imageRenderer],
});

export default async function Page({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const post = await fetchPageBySlug(slug);
  const slugWithPrefix = `/updates/${slug}`;

  const content = async () => {
    const blocks = await fetchPageBlocks(post.id);
    const html = await renderer.render(...blocks);

    return (
      <div
        className="notion-render"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className="container max-w-[1140px] flex">
      <BlurryCircle className="absolute top-[40%] -right-6 bg-[#F59F95]/30 dark:bg-[#F59F95]/10 -z-10 hidden md:block" />
      <BlurryCircle className="absolute top-[70%] right-[30%] bg-[#3633D0]/5 dark:bg-[#3633D0]/10 -z-10 hidden md:block" />

      <aside className="sticky h-screen min-w-[260px] pt-[150px] flex-col space-y-4 hidden md:flex">
        <Link href="/updates" className="text-sm font-normal text-[#878787]">
          View all posts
        </Link>
        <span className="font-medium text-sm">
          {format(new Date(post.created_time), "MMMM d, y")}
        </span>
      </aside>
      <div className="max-w-[680px] pt-[80px] md:pt-[150px] w-full">
        <PostStatus status={post.properties.Tag.select.name} />

        <h2 className="font-medium text-2xl mb-6">
          {post.properties.Title.title.at(0)?.plain_text}
        </h2>

        {content()}

        <PostMeta
          author={post.properties.Author.people.at(0)}
          slug={slugWithPrefix}
        />
      </div>
    </div>
  );
}
