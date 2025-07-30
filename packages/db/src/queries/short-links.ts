import type { Database } from "@db/client";
import { shortLinks, teams } from "@db/schema";
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
      fileName: shortLinks.fileName,
      teamName: teams.name,
      type: shortLinks.type,
      size: shortLinks.size,
      mimeType: shortLinks.mimeType,
      expiresAt: shortLinks.expiresAt,
    })
    .from(shortLinks)
    .leftJoin(teams, eq(shortLinks.teamId, teams.id))
    .where(eq(shortLinks.shortId, shortId))
    .limit(1);

  return result;
}

type CreateShortLinkData = {
  url: string;
  teamId: string;
  userId: string;
  type: "redirect" | "download";
  fileName?: string;
  mimeType?: string;
  size?: number;
  expiresAt?: string;
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
      type: data.type,
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      expiresAt: data.expiresAt,
    })
    .returning({
      id: shortLinks.id,
      shortId: shortLinks.shortId,
      url: shortLinks.url,
      type: shortLinks.type,
      fileName: shortLinks.fileName,
      mimeType: shortLinks.mimeType,
      size: shortLinks.size,
      createdAt: shortLinks.createdAt,
      expiresAt: shortLinks.expiresAt,
    });

  return result;
}
