/**
 * Testing for insufficient roles is very similar for all endpoints.
 *
 * Here we create some utilities that can be imported in the respective `{path}.security.test.ts`
 * files.
 */

import { describe, expect, test } from "vitest";

import { ErrorResponse } from "../../../src/pkg/errors";
import { IntegrationHarness } from "./integration-harness";
import type { StepRequest } from "./request";

type MaybePromise<T> = T | Promise<T>;

/**
 * The prepareRequest function must not return a request with Authorization header, because we take
 * care of that here.
 */
type StepRequestWithoutAuthorizationHeader<TReq> = Omit<
  StepRequest<TReq>,
  "headers"
> & {
  headers?: {
    [key: string]: string;
  } & {
    Authorization?: never;
  };
};

export function runCommonRouteTests<TReq>(
  config: {
    prepareRequest: (
      h: IntegrationHarness,
    ) => MaybePromise<StepRequestWithoutAuthorizationHeader<TReq>>;
  },
  db: D1Database,
) {
  describe("disabled workspace", () => {
    test("should reject the request", async (t) => {
      const h = await IntegrationHarness.init(t, db);

      const req = await config.prepareRequest(h);

      req.headers = {
        ...req.headers,
        // @ts-expect-error
        Authorization: `Bearer ${(await h.createRootKey(["*"])).key}`,
      };
      const res = await h.do<TReq, ErrorResponse>(req);
      expect(
        res.status,
        `expected: 403, received: ${JSON.stringify(res, null, 2)}`,
      ).toEqual(403);
      expect(res.body).toMatchObject({
        error: {
          code: "FORBIDDEN",
          docs: "https://unkey.dev/docs/api-reference/errors/code/FORBIDDEN",
          message: "workspace is disabled",
        },
      });
    });
  });
}
