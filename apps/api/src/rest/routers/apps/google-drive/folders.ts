import { protectedMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getInboxAccountById } from "@midday/db/queries";
import { decrypt } from "@midday/encryption";
import { GoogleDriveProvider } from "@midday/inbox/providers/google-drive";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const paramsSchema = z.object({
  accountId: z.string().uuid().openapi({
    param: { in: "query", name: "accountId", required: true },
    description: "The inbox account ID for the Google Drive connection",
  }),
});

const foldersResponseSchema = z.object({
  folders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List Google Drive folders",
    operationId: "listGoogleDriveFolders",
    description:
      "Lists top-level folders in the user's Google Drive for folder selection.",
    tags: ["Integrations"],
    request: {
      query: paramsSchema,
    },
    responses: {
      200: {
        description: "List of folders",
        content: {
          "application/json": {
            schema: foldersResponseSchema,
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
    const { accountId } = c.req.valid("query");

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

    // Initialize the provider with tokens
    const provider = new GoogleDriveProvider(db);

    const expiryDate = account.expiryDate
      ? new Date(account.expiryDate).getTime()
      : undefined;

    provider.setTokens({
      access_token: decrypt(account.accessToken),
      refresh_token: decrypt(account.refreshToken),
      expiry_date: expiryDate,
    });

    // Fetch folders
    const folders = await provider.getFolders();

    return c.json({ folders });
  },
);

export { app as foldersRouter };

