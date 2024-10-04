import { env } from "cloudflare:test";
import { expect, it } from "vitest";
import { upsertPost, readPost, listPosts } from "../src/utils";

it("should create and read post", async () => {
  await upsertPost(env.DATABASE, "/hello", "👋");

  const post = await readPost(env.DATABASE, "/hello");
  expect(post).toMatchInlineSnapshot(`
		{
		  "author": {
		    "email": "admin@example.com",
		    "name": "Ada Min",
		    "username": "admin",
		  },
		  "body": "👋",
		  "slug": "/hello",
		}
	`);
});

it("should list posts", async () => {
  await upsertPost(env.DATABASE, "/one", "1");
  await upsertPost(env.DATABASE, "/two", "2");
  await upsertPost(env.DATABASE, "/three", "3");

  const posts = await listPosts(env.DATABASE);
  expect(posts.length).toBe(3); // Note changes from previous test undone
  expect(posts[0].body).toBe("1");
  expect(posts[1].body).toBe("2");
  expect(posts[2].body).toBe("3");
});
