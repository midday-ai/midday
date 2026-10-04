import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Client } from "pg";
import { storageEndpoint } from "./environment";

/** Delete only exact UUID prefixes belonging to the disposable fixture account. */
export async function cleanupFixtures(
  db: Client,
  email: string,
  foreignTeamIds: string[],
) {
  if (process.env.E2E_KEEP_FIXTURES === "1") return;
  const { rows } = await db.query<{ id: string; team_id: string | null }>(
    "SELECT id,team_id FROM users WHERE email=$1",
    [email],
  );
  const user = rows[0];
  const client = new S3Client({
    endpoint: storageEndpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.E2E_STORAGE_ACCESS_KEY_ID ?? "midday",
      secretAccessKey:
        process.env.E2E_STORAGE_SECRET_ACCESS_KEY ?? "midday-secret",
    },
  });
  try {
    const prefixes: { Bucket: string; Prefix: string }[] = [];
    if (user) prefixes.push({ Bucket: "avatars", Prefix: `${user.id}/` });
    if (user?.team_id)
      prefixes.push({ Bucket: "vault", Prefix: `${user.team_id}/` });
    for (const prefix of prefixes) {
      let continuation: string | undefined;
      do {
        const result = await client.send(
          new ListObjectsV2Command({
            ...prefix,
            ContinuationToken: continuation,
          }),
        );
        const objects = (result.Contents ?? []).flatMap((object) =>
          object.Key ? [{ Key: object.Key }] : [],
        );
        if (objects.length) {
          const deleted = await client.send(
            new DeleteObjectsCommand({
              Bucket: prefix.Bucket,
              Delete: { Objects: objects },
            }),
          );
          if (deleted.Errors?.length)
            throw new Error("Failed to remove E2E storage fixtures");
        }
        continuation = result.IsTruncated
          ? result.NextContinuationToken
          : undefined;
      } while (continuation);
    }
  } finally {
    client.destroy();
  }
  if (user) await db.query("DELETE FROM auth_users WHERE id=$1", [user.id]);
  const teamIds = [...foreignTeamIds, ...(user?.team_id ? [user.team_id] : [])];
  if (teamIds.length)
    await db.query("DELETE FROM teams WHERE id=ANY($1::uuid[])", [teamIds]);
  // Disposable verification records can outlive the auth user; scope cleanup
  // to this exact generated address, not all auth sessions or verification rows.
  await db.query(
    "DELETE FROM auth_verifications WHERE identifier=$1 OR identifier=$2",
    [email, `sign-in-otp-${email}`],
  );
}
