import { PostAuthor } from "./post-author";
import { PostCopyURL } from "./post-copy-url";

export function PostMeta({ author, slug }) {
  return (
    <div className="border-b-[1px] border-border py-6 flex justify-between items-center mt-4">
      <PostAuthor src={author.avatar_url} name={author.name} id={author.id} />
      <PostCopyURL slug={slug} />
    </div>
  );
}
