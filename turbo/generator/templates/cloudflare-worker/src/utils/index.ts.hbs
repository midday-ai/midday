interface User {
  username: string;
  name: string;
  email: string;
}

interface Post {
  slug: string;
  author: User;
  body: string;
}

type QueryResult = User & Omit<Post, "author">;
function queryResultToPost(result: QueryResult): Post {
  return {
    slug: result.slug,
    body: result.body,
    author: {
      username: result.username,
      name: result.name,
      email: result.email,
    },
  };
}
export async function listPosts(db: D1Database): Promise<Post[]> {
  const results = await db
    .prepare(
      `
		SELECT slug, body, username, name, email
		FROM posts
		INNER JOIN users ON posts.author = users.username
		`,
    )
    .all<QueryResult>();
  return results.results.map(queryResultToPost);
}

export async function readPost(
  db: D1Database,
  slug: string,
): Promise<Post | null> {
  const result = await db
    .prepare(
      `
		SELECT slug, body, username, name, email
		FROM posts
		INNER JOIN users ON posts.author = users.username
		WHERE slug = ?1
		`,
    )
    .bind(slug)
    .first<QueryResult>();
  return result === null ? null : queryResultToPost(result);
}

export async function upsertPost(
  db: D1Database,
  slug: string,
  body: string,
): Promise<void> {
  await db
    .prepare(
      `
		INSERT INTO posts (slug, author, body)
		VALUES (?1, ?2, ?3)
		ON CONFLICT (slug) DO UPDATE SET
			author = ?2,
			body = ?3
		`,
    )
    .bind(slug, "admin", body)
    .run();
}

export { Post, User };
