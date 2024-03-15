import { fetchPages } from "@/lib/notion";
import { getStaticParams } from "@/locales/server";
import format from "date-fns/format";
import { setStaticParamsLocale } from "next-international/server";

export const dynamic = "static";

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
  }));

  console.log(data);

  return (
    <div className="container max-w-[1140px] flex">
      <aside className="sticky h-screen min-w-[260px] pt-[150px]">
        {links.map((link) => {
          return <div key={link.id}>{link.lable}</div>;
        })}
      </aside>
      <div className="max-w-[680px] pt-[150px]">wef</div>
    </div>
  );
}
