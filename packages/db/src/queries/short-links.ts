import { isLocalBackend } from "@midday/utils/backend";
import { eq, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import type { Database } from "../client";
import { numericCasted, shortLinks, teams } from "../schema";

// Existing Supabase schemas do not have the local object-reference columns.
// A separate query-only projection also keeps Drizzle INSERT from emitting them as DEFAULT.
const legacyShortLinks = pgTable("short_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  shortId: text("short_id").notNull(),
  url: text("url").notNull(),
  type: text("type"),
  size: numericCasted("size", { precision: 10, scale: 2 }),
  mimeType: text("mime_type"),
  fileName: text("file_name"),
  teamId: uuid("team_id").notNull(),
  userId: uuid("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export type ShortLink = {
  id: string;
  shortId: string;
  url: string;
  teamId: string;
  userId: string;
  createdAt: string;
};

export async function getShortLinkByShortId(db: Database, shortId: string) {
  const local = isLocalBackend();
  const [result] = await db
    .select({
      id: shortLinks.id,
      shortId: shortLinks.shortId,
      url: shortLinks.url,
      bucket: local ? shortLinks.bucket : sql<string | null>`null`,
      objectKey: local ? shortLinks.objectKey : sql<string | null>`null`,
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
  bucket?: "vault" | "avatars" | "apps";
  objectKey?: string;
  teamId: string;
  userId: string;
  type: "redirect" | "download";
  fileName?: string;
  mimeType?: string;
  size?: number;
  expiresAt?: string;
};

export async function createShortLink(db: Database, data: CreateShortLinkData) {
  const shortId = nanoid(21);
  const local = isLocalBackend();
  const table = local ? shortLinks : legacyShortLinks;

  const [result] = await db
    .insert(table)
    .values({
      shortId,
      url: data.url,
      ...(local ? { bucket: data.bucket, objectKey: data.objectKey } : {}),
      teamId: data.teamId,
      userId: data.userId,
      type: data.type,
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      expiresAt: data.expiresAt,
    })
    .returning({
      id: table.id,
      shortId: table.shortId,
      url: table.url,
      bucket: local ? shortLinks.bucket : sql<string | null>`null`,
      objectKey: local ? shortLinks.objectKey : sql<string | null>`null`,
      type: table.type,
      fileName: table.fileName,
      mimeType: table.mimeType,
      size: table.size,
      createdAt: table.createdAt,
      expiresAt: table.expiresAt,
    });

  return result;
}
