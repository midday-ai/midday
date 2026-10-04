import type { DatabaseOrTransaction } from "@midday/db/client";
import { upsertDocumentForObject } from "@midday/db/queries";
import { isLocalBackend } from "@midday/utils/backend";
import { type Body, upload } from "./index";
import { assertTeamKey } from "./keys";

/** Upload and register before downstream processors can observe the object. */
export async function uploadVaultObject(
  db: DatabaseOrTransaction,
  input: {
    teamId: string;
    key: string;
    body: Body;
    contentType: string;
    ownerId?: string | null;
  },
) {
  const key = assertTeamKey(input.teamId, input.key);
  const info = await upload("vault", key, input.body, {
    contentType: input.contentType,
  });
  // Existing Supabase installations retain their storage.objects registration trigger.
  if (isLocalBackend())
    await upsertDocumentForObject(db, {
      teamId: input.teamId,
      key,
      ownerId: input.ownerId,
      size: info.size,
      mimetype: input.contentType,
    });
  return { path: key };
}
