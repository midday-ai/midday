import { z } from "@hono/zod-openapi";
import type { App } from "../../pkg/hono/app";
import { getRoute, putRoute } from "./routes";
import { handleGetRequest, handlePutRequest } from "./handlers";

export class KVEndpoint {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  public registerRoutes() {
    this.app.openapi(getRoute, handleGetRequest);
    this.app.openapi(putRoute, handlePutRequest);
  }
}

export type V1KVGetResponse = z.infer<
  (typeof getRoute.responses)[200]["content"]["application/octet-stream"]["schema"]
>;

export const registerV1KVRoutes = (app: App) => {
  const kvEndpoint = new KVEndpoint(app);
  kvEndpoint.registerRoutes();
};
