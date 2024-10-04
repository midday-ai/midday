import type { TaskContext } from "vitest";
import type { z } from "zod";
import { benchmarkTestEnv } from "./env";
import { Harness } from "./harness";
import { type StepRequest, type StepResponse, step } from "./request";

export class BenchmarkHarness extends Harness {
  public readonly env: z.infer<typeof benchmarkTestEnv>;

  private constructor(t: TaskContext, d1: D1Database) {
    super(t, d1);
    this.env = benchmarkTestEnv.parse(process.env);
  }

  static async init(t: TaskContext, d1: D1Database): Promise<BenchmarkHarness> {
    const h = new BenchmarkHarness(t, d1);
    return h;
  }

  async get<TRes>(
    req: Omit<StepRequest<never>, "method">,
  ): Promise<StepResponse<TRes>> {
    return await step<never, TRes>({ method: "GET", ...req });
  }
  async post<TReq, TRes>(
    req: Omit<StepRequest<TReq>, "method">,
  ): Promise<StepResponse<TRes>> {
    return await step<TReq, TRes>({ method: "POST", ...req });
  }
  async put<TReq, TRes>(
    req: Omit<StepRequest<TReq>, "method">,
  ): Promise<StepResponse<TRes>> {
    return await step<TReq, TRes>({ method: "PUT", ...req });
  }
  async delete<TRes>(
    req: Omit<StepRequest<never>, "method">,
  ): Promise<StepResponse<TRes>> {
    return await step<never, TRes>({ method: "DELETE", ...req });
  }
}
