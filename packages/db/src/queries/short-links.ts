import type { Database } from "@db/client";
import { shortLinks } from "@db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type ShortLink = {
  id: string;
  shortId: string;
  url: string;
  teamId: string;
  userId: string;
  createdAt: string;
};

export async function getShortLinkByShortId(db: Database, shortId: string) {
  const [result] = await db
    .select({
      id: shortLinks.id,
      shortId: shortLinks.shortId,
      url: shortLinks.url,
      teamId: shortLinks.teamId,
      userId: shortLinks.userId,
      createdAt: shortLinks.createdAt,
    })
    .from(shortLinks)
    .where(eq(shortLinks.shortId, shortId))
    .limit(1);

  return result;
}

type CreateShortLinkData = {
  url: string;
  teamId: string;
  userId: string;
};

export async function createShortLink(db: Database, data: CreateShortLinkData) {
  const shortId = nanoid(8);

  const [result] = await db
    .insert(shortLinks)
    .values({
      shortId,
      url: data.url,
      teamId: data.teamId,
      userId: data.userId,
    })
    .returning({
      id: shortLinks.id,
      shortId: shortLinks.shortId,
      url: shortLinks.url,
      createdAt: shortLinks.createdAt,
    });

  return result;
}
