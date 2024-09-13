import type { Metadata } from "next";
import { Article } from "@/components/article";
import { BlurryCircle } from "@/components/blurry-circle";
import { UpdatesToolbar } from "@/components/updates-toolbar";
import { getReleasePosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Releases",
};

export default async function Page() {
  const data = getReleasePosts();

  const posts = data
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .map((post, index) => (
      <Article data={post} firstPost={index === 0} viewType="releases" />
    ));

  return (
    <div className="container flex justify-center scroll-smooth">
      <BlurryCircle className="absolute -right-6 top-[40%] -z-10 hidden bg-[#F59F95]/30 dark:bg-[#F59F95]/10 md:block" />
      <BlurryCircle className="absolute right-[30%] top-[70%] -z-10 hidden bg-[#3633D0]/5 dark:bg-[#3633D0]/10 md:block" />

      <div className="w-full max-w-[680px] pt-[80px] md:pt-[150px]">
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
