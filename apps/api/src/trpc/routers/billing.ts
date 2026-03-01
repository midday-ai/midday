import {
  cancelSubscriptionSchema,
  createCheckoutSchema,
  getBillingOrdersSchema,
} from "@api/schemas/billing";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { api } from "@api/utils/polar";
import { getTeamById } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { getPlanIntervalByProductId, getPlanProductId } from "@midday/plans";
import { z } from "zod";

const logger = createLoggerWithContext("trpc:billing");

export const billingRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ input, ctx: { db, session, teamId } }) => {
      const { plan, planType, embedOrigin, currency } = input;

      // Get team data
      const team = await getTeamById(db, teamId!);

      if (!team) {
        throw new Error("Team not found");
      }

      const yearly = planType?.endsWith("_yearly") ?? false;
      const productId = getPlanProductId(plan, yearly);

      // Create Polar checkout
      const checkout = await api.checkouts.create({
        products: [productId],
        allowDiscountCodes: false,
        externalCustomerId: team.id,
        customerEmail: session.user.email ?? undefined,
        customerName: team.name ?? undefined,
        metadata: {
          teamId: team.id,
          companyName: team.name ?? "",
        },
        embedOrigin,
        currency: currency === "EUR" ? "eur" : "usd",
      });

      return { url: checkout.url };
    }),

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

        // Filter orders to only include those where metadata.teamId matches teamId
        const filteredOrders = orders.filter((order) => {
          const organizationId = order.metadata?.teamId;
          return organizationId === teamId;
        });

        return {
          data: filteredOrders.map((order) => ({
            id: order.id,
            createdAt: order.createdAt,
            amount: {
              amount: order.totalAmount,
              currency: order.currency,
            },
            status: order.status,
            product: {
              name: order.product?.name || "Subscription",
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
      } catch {
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

        // If invoice doesn't exist, generate it
        if (!order.isInvoiceGenerated) {
          await api.orders.generateInvoice({
            id: orderId,
          });

          // Return status indicating generation is in progress
          return {
            status: "generating",
          };
        }

        // Try to get the invoice
        try {
          const invoice = await api.orders.invoice({
            id: orderId,
          });

          return {
            status: "ready",
            downloadUrl: invoice.url,
          };
        } catch (_invoiceError) {
          // Invoice might still be generating
          return {
            status: "generating",
          };
        }
      } catch (error) {
        logger.error("Failed to get invoice download URL", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error(
          error instanceof Error ? error.message : "Failed to download invoice",
        );
      }
    }),

  checkInvoiceStatus: protectedProcedure
    .input(z.string())
    .query(async ({ input: orderId, ctx: { teamId } }) => {
      try {
        const order = await api.orders.get({
          id: orderId,
        });

        // Verify the order belongs to the team's customer
        if (order.customer.externalId !== teamId) {
          throw new Error("Order not found or not authorized");
        }

        if (!order.isInvoiceGenerated) {
          return {
            status: "not_generated",
          };
        }

        try {
          const invoice = await api.orders.invoice({
            id: orderId,
          });

          return {
            status: "ready",
            downloadUrl: invoice.url,
          };
        } catch (_invoiceError) {
          return {
            status: "generating",
          };
        }
      } catch (error) {
        logger.error("Failed to check invoice status", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to check invoice status",
        );
      }
    }),

  getActiveSubscription: protectedProcedure.query(
    async ({ ctx: { teamId } }) => {
      try {
        const subscriptions = await api.subscriptions.list({
          externalCustomerId: teamId!,
        });

        const active = subscriptions.result.items.find(
          (s) => s.status === "active" || s.status === "past_due",
        );

        if (!active) {
          return null;
        }

        const interval = getPlanIntervalByProductId(active.productId);

        return { isYearly: interval === "year" };
      } catch {
        return null;
      }
    },
  ),

  getPortalUrl: protectedProcedure.mutation(async ({ ctx: { teamId } }) => {
    const result = await api.customerSessions.create({
      externalCustomerId: teamId!,
    });

    return { url: result.customerPortalUrl };
  }),

  cancelSubscription: protectedProcedure
    .input(cancelSubscriptionSchema)
    .mutation(async ({ input, ctx: { teamId } }) => {
      const subscriptions = await api.subscriptions.list({
        externalCustomerId: teamId!,
      });

      const activeSubscription = subscriptions.result.items.find(
        (s) => s.status === "active" || s.status === "past_due",
      );

      if (!activeSubscription) {
        throw new Error("No active subscription found");
      }

      await api.subscriptions.update({
        id: activeSubscription.id,
        subscriptionUpdate: {
          cancelAtPeriodEnd: true,
          customerCancellationReason: input.reason,
          customerCancellationComment: input.comment,
        },
      });

      logger.info("Subscription canceled", {
        teamId,
        reason: input.reason,
      });

      return { success: true };
    }),
});
