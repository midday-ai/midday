import { getInboxByIdSchema, getInboxSchema } from "@api/schemas/inbox";
import { getInbox, getInboxById } from "@midday/db/queries";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerInboxTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require inbox.read scope
  if (!hasScope(ctx, "inbox.read")) {
    return;
  }
  server.registerTool(
    "inbox_list",
    {
      title: "List Inbox Items",
      description:
        "List inbox items (uploaded receipts, invoices, documents). Filter by status to find pending or matched items.",
      inputSchema: getInboxSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getInbox(db, {
        teamId,
        cursor: params.cursor ?? null,
        pageSize: params.pageSize ?? 25,
        order: params.order ?? null,
        sort: params.sort ?? null,
        q: params.q ?? null,
        status: params.status ?? null,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "inbox_get",
    {
      title: "Get Inbox Item",
      description:
        "Get a specific inbox item by ID with full details including matched transaction.",
      inputSchema: {
        id: getInboxByIdSchema.shape.id,
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id }) => {
      const result = await getInboxById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Inbox item not found" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
