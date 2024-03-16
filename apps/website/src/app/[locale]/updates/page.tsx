import { PostLinks } from "@/components/post-links";
import { PostMeta } from "@/components/post-meta";
import { PostStatus } from "@/components/post-status";
import { fetchPageBlocks, fetchPages } from "@/lib/notion";
import { getStaticParams } from "@/locales/server";
import format from "date-fns/format";
import { setStaticParamsLocale } from "next-international/server";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 0;

export function generateStaticParams() {
  return getStaticParams();
}

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

  const posts = data.results.map(async (post) => {
    const blocks = await fetchPageBlocks(post.id);
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

        <PostMeta author={post.properties.Author.people.at(0)} slug={slug} />
      </div>
    );
  });

  return (
    <div className="container max-w-[1140px] flex scroll-smooth">
      <PostLinks links={links} />
      <div className="max-w-[680px] pt-[150px] w-full">{posts}</div>
    </div>
  );
}
