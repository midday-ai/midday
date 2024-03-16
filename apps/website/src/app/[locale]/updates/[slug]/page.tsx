import { PostMeta } from "@/components/post-meta";
import { PostStatus } from "@/components/post-status";
import { fetchPageBlocks, fetchPageBySlug, fetchPages } from "@/lib/notion";
import { getStaticParams } from "@/locales/server";
import { format } from "date-fns";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 0;

export async function generateStaticParams() {
  const data = await fetchPages();

  return data.results.map((post) => ({
    slug: post.properties.Slug.url,
    ...getStaticParams(),
  }));
}

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const post = await fetchPageBySlug(slug);

  return {
    title: `Midday | ${post.properties.Title.title.at(0)?.plain_text}`,
  };
}

export default async function Page({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setStaticParamsLocale(locale);

  const post = await fetchPageBySlug(slug);
  const blocks = await fetchPageBlocks(post.id);
  const slugWithPrefix = `/updates/${slug}`;

  return (
    <div className="container max-w-[1140px] flex updates">
      <aside className="sticky h-screen min-w-[260px] pt-[150px] flex flex-col space-y-4">
        <Link href="/updates" className="text-sm font-normal text-[#878787]">
          View all posts
        </Link>
        <span className="font-medium text-sm">
          {format(new Date(post.created_time), "MMMM d, y")}
        </span>
      </aside>
      <div className="max-w-[680px] pt-[150px] w-full">
        <PostStatus status={post.properties.Tag.select.name} />

        <h2 className="font-medium text-2xl mb-6">
          {post.properties.Title.title.at(0)?.plain_text}
        </h2>

        {blocks.map((block) => {
          switch (block.type) {
            case "image":
              return (
                <Image
                  className="mb-6"
                  key={block.id}
                  width={800}
                  height={520}
                  src={block.image.file.url}
                />
              );

            case "paragraph":
              return (
                <p className="mb-6 text-[#878787]" key={block.id}>
                  {block.paragraph.rich_text.at(0)?.plain_text}
                </p>
              );

            default:
              return null;
          }
        })}

        <PostMeta
          author={post.properties.Author.people.at(0)}
          slug={slugWithPrefix}
        />
      </div>
    </div>
  );
}
