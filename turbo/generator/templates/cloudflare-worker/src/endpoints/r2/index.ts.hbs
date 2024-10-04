import { createRoute, RouteConfigToTypedResponse, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import type { App } from "../../pkg/hono/app";
import {
  handleDeleteRequest,
  handleGetRequest,
  handlePutRequest,
} from "./handlers";
import { deleteRoute, getRoute, putRoute } from "./routes";

// Define the Zod schema for our record type
class R2Endpoint {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  public registerRoutes() {
    this.app.openapi(
      getRoute,
      (c) =>
        handleGetRequest(c) as Promise<
          RouteConfigToTypedResponse<typeof getRoute>
        >,
    );
    this.app.openapi(
      putRoute,
      (c) =>
        handlePutRequest(c) as Promise<
          RouteConfigToTypedResponse<typeof putRoute>
        >,
    );
    this.app.openapi(
      deleteRoute,
      (c) =>
        handleDeleteRequest(c) as Promise<
          RouteConfigToTypedResponse<typeof deleteRoute>
        >,
    );
  }
}

// Export the R2Endpoint class to access route definitions
export { R2Endpoint };

// Define response types using the exported class
export type V1R2GetResponse = z.infer<
  (typeof getRoute.responses)[200]["content"]["application/json"]["schema"]
>;

export type V1R2PutResponse = z.infer<
  (typeof putRoute.responses)[201]["content"]["application/json"]["schema"]
>;

export type V1R2DeleteResponse = z.infer<
  (typeof deleteRoute.responses)[200]["content"]["application/json"]["schema"]
>;

export const registerV1R2Routes = (app: App) => {
  const r2Endpoint = new R2Endpoint(app);
  r2Endpoint.registerRoutes();
};
