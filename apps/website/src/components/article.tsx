import { ArticleInView } from "@/components/article-in-view";
import { CustomMDX } from "@/components/mdx";
import { PostStatus } from "@/components/post-status";
import Image from "next/image";
import Link from "next/link";

type Props = {
  firstPost: boolean;
  data: {
    slug: string;
    metadata: {
      tag: string;
      title: string;
      image?: string;
    };
    content: string;
  };
};

export function Article({ data, firstPost }: Props) {
  return (
    <article key={data.slug} className="pt-28 mb-20 -mt-28" id={data.slug}>
      <ArticleInView slug={data.slug} firstPost={firstPost} />

      <PostStatus status={data.metadata.tag} />
      <Link className="mb-6 block" href={`/updates/${data.slug}`}>
        <h2 className="font-medium text-2xl mb-6">{data.metadata.title}</h2>
      </Link>

      <div className="updates">
        {data.metadata.image && (
          <Image
            src={data.metadata.image}
            alt={data.metadata.title}
            width={680}
            height={442}
            className="mb-12"
          />
        )}

        <CustomMDX source={data.content} />
      </div>
    </article>
  );
}
