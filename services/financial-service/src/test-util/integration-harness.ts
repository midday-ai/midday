import { env } from "hono/adapter";
import type { TaskContext } from "vitest";
import { integrationTestEnv } from "./env";
import { Harness } from "./harness";
import { type StepRequest, type StepResponse, step } from "./request";

/**
 * IntegrationHarness is an extension of the `Harness` class that provides methods for making HTTP requests
 * within an integration testing environment, specifically using the `HonoEnv`. It abstracts the logic for
 * executing HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) against the integration environment.
 *
 * @extends {Harness}
 */
export class IntegrationHarness extends Harness {

    /**
     * Base URL for the integration tests, retrieved from environment variables.
     * This is the base URL where all requests made by the `IntegrationHarness` will be directed.
     * 
     * @type {string}
     */
    public readonly baseUrl: string;

    /**
     * Private constructor that initializes the integration harness with a test context and sets up the base URL
     * from environment variables, specifically using `HonoEnv` for the environment configuration.
     * The constructor is private because the class is designed to be initialized using the `init` static method.
     *
     * @param {TaskContext<HonoEnv>} t - The test execution context provided by Vitest, which includes `HonoEnv`. 
     * This contains information about the current test and its environment.
     */
    private constructor(t: TaskContext, db: D1Database) {
        super(t, db);
        this.baseUrl = integrationTestEnv.parse(env).ENGINE_BASE_URL;
    }

    /**
     * Static method to asynchronously initialize the `IntegrationHarness`.
     * This method creates an instance of the harness, seeds any necessary data, and returns the fully initialized object.
     *
     * @param {TaskContext<HonoEnv>} t - The test execution context provided by Vitest, with `HonoEnv` passed as the environment type.
     * @returns {Promise<IntegrationHarness>} - A promise that resolves to an instance of `IntegrationHarness` after initialization.
     */
    static async init(t: TaskContext, db: D1Database): Promise<IntegrationHarness> {
        const h = new IntegrationHarness(t, db);
        await h.seed();
        return h;
    }

    /**
     * Performs an HTTP request with the specified request configuration.
     * It automatically resolves the `url` using the base URL provided by the integration environment.
     *
     * @template TRequestBody - The expected request body type.
     * @template TResponseBody - The expected response body type.
     * @param {StepRequest<TRequestBody>} req - The request configuration, including URL and request body.
     * @returns {Promise<StepResponse<TResponseBody>>} - A promise that resolves with the response of the request.
     */
    async do<TRequestBody = unknown, TResponseBody = unknown>(
        req: StepRequest<TRequestBody>,
    ): Promise<StepResponse<TResponseBody>> {
        const reqWithUrl: StepRequest<TRequestBody> = {
            ...req,
            url: new URL(req.url, this.baseUrl).toString(),
        };
        return step(reqWithUrl);
    }

    /**
     * Sends an HTTP `GET` request using the provided request data.
     * 
     * @template TRes - The expected response type for the GET request.
     * @param {Omit<StepRequest<never>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the GET request.
     */
    async get<TRes>(req: Omit<StepRequest<never>, "method">): Promise<StepResponse<TRes>> {
        return this.do<never, TRes>({ method: "GET", ...req });
    }

    /**
     * Sends an HTTP `POST` request using the provided request data.
     * 
     * @template TReq - The type of the request body for the POST request.
     * @template TRes - The expected response type for the POST request.
     * @param {Omit<StepRequest<TReq>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the POST request.
     */
    async post<TReq, TRes>(req: Omit<StepRequest<TReq>, "method">): Promise<StepResponse<TRes>> {
        return this.do<TReq, TRes>({ method: "POST", ...req });
    }

    /**
     * Sends an HTTP `PUT` request using the provided request data.
     * 
     * @template TReq - The type of the request body for the PUT request.
     * @template TRes - The expected response type for the PUT request.
     * @param {Omit<StepRequest<TReq>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the PUT request.
     */
    async put<TReq, TRes>(req: Omit<StepRequest<TReq>, "method">): Promise<StepResponse<TRes>> {
        return this.do<TReq, TRes>({ method: "PUT", ...req });
    }

    /**
     * Sends an HTTP `DELETE` request using the provided request data.
     * 
     * @template TRes - The expected response type for the DELETE request.
     * @param {Omit<StepRequest<never>, "method">} req - The request data, excluding the HTTP method.
     * @returns {Promise<StepResponse<TRes>>} - A promise that resolves with the response of the DELETE request.
     */
    async delete<TRes>(req: Omit<StepRequest<never>, "method">): Promise<StepResponse<TRes>> {
        return this.do<never, TRes>({ method: "DELETE", ...req });
    }
}