"use server";

import { appRouter } from "@midday/api";
import { createTRPCContext } from "@/utils/server";

export default async function PostList() {
  const server = appRouter.createCaller(await createTRPCContext());

  const posts = await server.post.all();

  return posts.map((post) => (
    <div key={post.id}>
      <p>{post.content}</p>
    </div>
  ));
}
