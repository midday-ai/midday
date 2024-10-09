import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { getHealthCheck } from "@/utils/search";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { HealthSchema } from "./schema";

const route = createRoute({
    tags: ["apis"],
    operationId: "healthCheckApi",
    method: "get",
    path: "/",
    summary: "Health",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: HealthSchema,
                },
            },
            description: "Retrieve health",
        },
        ...ErrorResponses
    },
});

export type V1ApisGetHealthApiRoute = typeof route;
export type V1ApisGetHealthApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

export const registerV1GetHealth = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);

        const api = new Provider();

        const providers = await api.getHealthCheck({
            kv: c.env.KV,
            fetcher: c.env.TELLER_CERT,
            r2: c.env.STORAGE,
            envs,
        });

        const search = await getHealthCheck(envs);

        const allServices = {
            ...providers,
            search,
        };

        const isHealthy = Object.values(allServices).every(
            (service) => service.healthy,
        );

        if (!isHealthy) {
            throw new ServiceApiError({
                message: "Service unhealthy",
                code: "INTERNAL_SERVER_ERROR",
            });
        }

        return c.json(
            {
                data: allServices,
            },
            200,
        );
    });
};