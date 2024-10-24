import { env } from "hono/adapter";
import type { TaskContext } from "vitest";
import type { z } from "zod";
import { benchmarkTestEnv } from "./env";
import { Harness } from "./harness";
import { type StepRequest, type StepResponse, step } from "./request";

/**
 * BenchmarkHarness is an extension of the `Harness` class that provides additional functionality
 * for executing benchmark tests within a predefined environment. This class abstracts the logic for
 * performing HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) and initializes the environment for the benchmark tests.
 *
 * @extends {Harness}
 */
export class BenchmarkHarness extends Harness {

    /**
     * Parsed environment variables specific to the benchmark tests.
     * The `benchmarkTestEnv` is parsed using the Zod schema and will fail if the environment is not correctly configured.
     *
     * @type {z.infer<typeof benchmarkTestEnv>}
     */
    public readonly env: z.infer<typeof benchmarkTestEnv>;

    /**
     * Private constructor that initializes the harness with a test context and sets up the environment.
     * The constructor is private because the class is meant to be initialized using the `init` static method.
     *
     * @param {TaskContext<HonoEnv>} t - The test execution context provided by Vitest. This contains information about the current test.
     */
    private constructor(t: TaskContext, db: D1Database) {
        super(t, db);
        this.env = benchmarkTestEnv.parse(env);
    }

    /**
     * Static method to asynchronously initialize the `BenchmarkHarness`.
     * This method creates an instance of the harness, seeds any necessary data, and returns the fully initialized object.
     *
     * @param {TaskContext<HonoEnv>} t - The test execution context provided by Vitest.
     * @returns {Promise<BenchmarkHarness>} - A promise that resolves to an instance of `BenchmarkHarness` after initialization.
     */
    static async init(t: TaskContext, db: D1Database): Promise<BenchmarkHarness> {
        const h = new BenchmarkHarness(t, db);
        await h.seed();
        return h;
    }

    /**
     * Sends an HTTP `GET` request using the provided request data. 
     * This method performs a GET request and expects a response of the specified generic type `TRes`.
     *
     * @template TRes - The expected response type for the GET request.
     * @param {Omit<StepRequest<never>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the GET request.
     */
    async get<TRes>(req: Omit<StepRequest<never>, "method">): Promise<StepResponse<TRes>> {
        return await step<never, TRes>({ method: "GET", ...req });
    }

    /**
     * Sends an HTTP `POST` request using the provided request data. 
     * This method performs a POST request with the request payload `TReq` and expects a response of type `TRes`.
     *
     * @template TReq - The type of the request body for the POST request.
     * @template TRes - The expected response type for the POST request.
     * @param {Omit<StepRequest<TReq>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the POST request.
     */
    async post<TReq, TRes>(req: Omit<StepRequest<TReq>, "method">): Promise<StepResponse<TRes>> {
        return await step<TReq, TRes>({ method: "POST", ...req });
    }

    /**
     * Sends an HTTP `PUT` request using the provided request data. 
     * This method performs a PUT request with the request payload `TReq` and expects a response of type `TRes`.
     *
     * @template TReq - The type of the request body for the PUT request.
     * @template TRes - The expected response type for the PUT request.
     * @param {Omit<StepRequest<TReq>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the PUT request.
     */
    async put<TReq, TRes>(req: Omit<StepRequest<TReq>, "method">): Promise<StepResponse<TRes>> {
        return await step<TReq, TRes>({ method: "PUT", ...req });
    }

    /**
     * Sends an HTTP `DELETE` request using the provided request data. 
     * This method performs a DELETE request and expects a response of the specified generic type `TRes`.
     *
     * @template TRes - The expected response type for the DELETE request.
     * @param {Omit<StepRequest<never>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the DELETE request.
     */
    async delete<TRes>(req: Omit<StepRequest<never>, "method">): Promise<StepResponse<TRes>> {
        return await step<never, TRes>({ method: "DELETE", ...req });
    }
}
