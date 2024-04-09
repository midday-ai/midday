import { Article } from "@/components/article";
import { BlurryCircle } from "@/components/blurry-circle";
import { UpdatesToolbar } from "@/components/updates-toolbar";
import { getBlogPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates",
};

export default async function Page() {
  const data = getBlogPosts();

  const posts = data
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .map((post, index) => <Article data={post} firstPost={index === 0} />);

  return (
    <div className="container flex justify-center scroll-smooth">
      <BlurryCircle className="absolute top-[40%] -right-6 bg-[#F59F95]/30 dark:bg-[#F59F95]/10 -z-10 hidden md:block" />
      <BlurryCircle className="absolute top-[70%] right-[30%] bg-[#3633D0]/5 dark:bg-[#3633D0]/10 -z-10 hidden md:block" />

      <div className="max-w-[680px] pt-[80px] md:pt-[150px] w-full">
        {posts}
      </div>

      <UpdatesToolbar
        posts={data.map((post) => ({
          slug: post.slug,
          title: post.metadata.title,
        }))}
      />
    </div>
  );
}
