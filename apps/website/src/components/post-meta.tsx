import { PostAuthor } from "./post-author";
import { PostCopyURL } from "./post-copy-url";

export function PostMeta({ author, slug }) {
  return (
    <div className="border-b-[1px] py-6 flex justify-between items-center">
      <PostAuthor src={author.avatar_url} name={author.name} id={author.id} />
      <PostCopyURL />
    </div>
  );
}
