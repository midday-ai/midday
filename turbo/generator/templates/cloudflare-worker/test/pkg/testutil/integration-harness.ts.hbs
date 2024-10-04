import type { TaskContext } from "vitest";
import { integrationTestEnv } from "./env";
import { Harness } from "./harness";
import { type StepRequest, type StepResponse, step } from "./request";

export class IntegrationHarness extends Harness {
  public readonly baseUrl: string;

  private constructor(t: TaskContext, d1: D1Database) {
    super(t, d1);
    this.baseUrl = integrationTestEnv.parse(process.env).UNKEY_BASE_URL;
  }

  static async init(
    t: TaskContext,
    d1: D1Database,
  ): Promise<IntegrationHarness> {
    const h = new IntegrationHarness(t, d1);
    return h;
  }

  async do<TRequestBody = unknown, TResponseBody = unknown>(
    req: StepRequest<TRequestBody>,
  ): Promise<StepResponse<TResponseBody>> {
    const reqWithUrl: StepRequest<TRequestBody> = {
      ...req,
      url: new URL(req.url, this.baseUrl).toString(),
    };
    return step(reqWithUrl);
  }
  async get<TRes>(
    req: Omit<StepRequest<never>, "method">,
  ): Promise<StepResponse<TRes>> {
    return this.do<never, TRes>({ method: "GET", ...req });
  }
  async post<TReq, TRes>(
    req: Omit<StepRequest<TReq>, "method">,
  ): Promise<StepResponse<TRes>> {
    return this.do<TReq, TRes>({ method: "POST", ...req });
  }
  async put<TReq, TRes>(
    req: Omit<StepRequest<TReq>, "method">,
  ): Promise<StepResponse<TRes>> {
    return this.do<TReq, TRes>({ method: "PUT", ...req });
  }
  async delete<TRes>(
    req: Omit<StepRequest<never>, "method">,
  ): Promise<StepResponse<TRes>> {
    return this.do<never, TRes>({ method: "DELETE", ...req });
  }
}
