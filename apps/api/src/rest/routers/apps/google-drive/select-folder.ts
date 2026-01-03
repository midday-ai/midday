import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getInboxAccountById, updateInboxAccount } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const bodySchema = z.object({
  accountId: z.string().uuid(),
  folderId: z.string(),
  folderName: z.string(),
});

const responseSchema = z.object({
  success: z.boolean(),
  accountId: z.string(),
});

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Select Google Drive folder to watch",
    operationId: "selectGoogleDriveFolder",
    description:
      "Saves the selected folder for a Google Drive inbox account and triggers initial sync.",
    tags: ["Integrations"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: bodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Folder selected successfully",
        content: {
          "application/json": {
            schema: responseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "Account not found",
      },
    },
  }),
  async (c) => {
    const session = c.get("session");
    const db = c.get("db");
    const { accountId, folderId, folderName } = c.req.valid("json");

    if (!session?.user || !session.teamId) {
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    // Get the inbox account
    const account = await getInboxAccountById(db, {
      id: accountId,
      teamId: session.teamId,
    });

    if (!account) {
      throw new HTTPException(404, {
        message: "Account not found",
      });
    }

    if (account.provider !== "google_drive") {
      throw new HTTPException(400, {
        message: "Account is not a Google Drive connection",
      });
    }

    // Update the account with the selected folder
    await updateInboxAccount(db, {
      id: accountId,
      metadata: {
        folderId,
        folderName,
      },
    });

    // Now trigger the initial setup job to register the scheduler and start syncing
    await triggerJob(
      "initial-setup",
      {
        inboxAccountId: accountId,
      },
      "inbox-provider",
    );

    return c.json({ success: true, accountId });
  },
);

export { app as selectFolderRouter };

