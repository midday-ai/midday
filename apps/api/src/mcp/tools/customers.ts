import {
  getCustomerByIdSchema,
  getCustomersSchema,
} from "@api/schemas/customers";
import { getCustomerById, getCustomers } from "@midday/db/queries";
import { READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerCustomerTools: RegisterTools = (
  server,
  { db, teamId },
) => {
  server.registerTool(
    "customers_list",
    {
      title: "List Customers",
      description:
        "List customers with filtering and search. Use this to find customer information.",
      inputSchema: getCustomersSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getCustomers(db, {
        teamId,
        cursor: params.cursor ?? null,
        pageSize: params.pageSize ?? 25,
        q: params.q ?? null,
        sort: params.sort ?? null,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "customers_get",
    {
      title: "Get Customer",
      description: "Get a specific customer by their ID with full details",
      inputSchema: {
        id: getCustomerByIdSchema.shape.id,
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id }) => {
      const result = await getCustomerById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Customer not found" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
