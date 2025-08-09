import { getBillingOrdersSchema } from "@api/schemas/billing";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { api } from "@api/utils/polar";
import { z } from "zod";

export const billingRouter = createTRPCRouter({
  orders: protectedProcedure
    .input(getBillingOrdersSchema)
    .query(async ({ input, ctx: { teamId } }) => {
      try {
        const customer = await api.customers.getExternal({
          externalId: teamId!,
        });

        const ordersResult = await api.orders.list({
          customerId: customer.id,
          page: input.cursor ? Number(input.cursor) : 1,
          limit: input.pageSize,
        });

        const orders = ordersResult.result.items;
        const pagination = ordersResult.result.pagination;

        return {
          data: orders.map((order) => ({
            id: order.id,
            createdAt: order.createdAt,
            amount: {
              amount: order.totalAmount,
              currency: order.currency,
            },
            status: order.status,
            product: {
              name: order.product.name,
            },
            invoiceId: order.isInvoiceGenerated ? order.id : null,
          })),
          meta: {
            hasNextPage:
              (input.cursor ? Number(input.cursor) : 1) < pagination.maxPage,
            cursor:
              (input.cursor ? Number(input.cursor) : 1) < pagination.maxPage
                ? ((input.cursor ? Number(input.cursor) : 1) + 1).toString()
                : undefined,
          },
        };
      } catch (error) {
        console.error("Failed to fetch billing orders:", error);
        return {
          data: [],
          meta: {
            hasNextPage: false,
            cursor: undefined,
          },
        };
      }
    }),

  getInvoice: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: orderId, ctx: { teamId } }) => {
      try {
        const order = await api.orders.get({
          id: orderId,
        });

        // Verify the order belongs to the team's customer
        if (order.customer.externalId !== teamId) {
          throw new Error("Order not found or not authorized");
        }

        if (!order.isInvoiceGenerated) {
          await api.orders.generateInvoice({
            id: orderId,
          });
        }

        const invoice = await api.orders.invoice({
          id: orderId,
        });

        return {
          downloadUrl: invoice.url,
        };
      } catch (error) {
        console.error("Failed to get invoice download URL:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to download invoice",
        );
      }
    }),
});
