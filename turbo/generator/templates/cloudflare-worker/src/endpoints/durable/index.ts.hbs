import type { App } from "../../pkg/hono/app";
import { serviceDurableObjectRoute } from "./routes";
import { handleServiceDurableObjectRequest } from "./handlers";
import { RouteConfigToTypedResponse } from "@hono/zod-openapi";

export class ServiceDurableObjectEndpoint {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }
  public registerRoutes() {
    this.app.openapi(serviceDurableObjectRoute, async (c) => {
      const response = await handleServiceDurableObjectRequest(c);
      return response as unknown as RouteConfigToTypedResponse<
        typeof serviceDurableObjectRoute
      >;
    });
  }
}

export const registerV1ServiceDurableObjectRoutes = (app: App) => {
  const serviceDurableObjectEndpoint = new ServiceDurableObjectEndpoint(app);
  serviceDurableObjectEndpoint.registerRoutes();
};
