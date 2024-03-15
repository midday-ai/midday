import { PostMeta } from "@/components/post-meta";
import { PostStatus } from "@/components/post-status";
import { fetchPageBlocks, fetchPages, notion } from "@/lib/notion";
import { getStaticParams } from "@/locales/server";
import { NotionRenderer } from "@notion-render/client";
import format from "date-fns/format";
import { setStaticParamsLocale } from "next-international/server";

export const dynamic = "static";
export const revalidate = 3600;

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
    lable: format(new Date(post.properties.Date.date.start), "MMMM d, y"),
  }));

  const posts = data.results
    .sort((a, b) => a.properties.Date.date.start - b.properties.Date.date.start)
    .map(async (post) => {
      const blocks = await fetchPageBlocks(post.id);
      const html = await renderer.render(...blocks);

      return (
        <div key={post.id} className="mb-20">
          <PostStatus status={post.properties.Tag.select.name} />

          <h2 className="font-medium text-2xl mb-6">
            {post.properties.Title.title.at(0)?.plain_text}
          </h2>
          <div
            className="notion-render"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <PostMeta author={post.properties.Author.people.at(0)} />
        </div>
      );
    });

  const renderer = new NotionRenderer({
    client: notion,
  });

  return (
    <div className="container max-w-[1140px] flex updates">
      <aside className="sticky h-screen min-w-[260px] pt-[150px]">
        {links.map((link) => {
          return <div key={link.id}>{link.lable}</div>;
        })}
      </aside>
      <div className="max-w-[680px] pt-[150px]">{posts}</div>
    </div>
  );
}
