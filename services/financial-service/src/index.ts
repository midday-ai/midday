import { Env, zEnv } from "./env";
import { newApp } from "./hono/app";
import { ConsoleLogger } from "./logger";
import { UserActionMessageBody } from "./message";
import { setupRoutes } from "./routes";

const app = newApp();

// set up all the routes
setupRoutes(app);

// define default handler
const handler = {
    fetch: (req: Request, env: Env, executionCtx: ExecutionContext) => {
        const parsedEnv = zEnv.safeParse(env);
        if (!parsedEnv.success) {
            new ConsoleLogger({
                requestId: "",
                environment: env.ENVIRONMENT,
                application: "api",
            }).fatal(`BAD_ENVIRONMENT: ${parsedEnv.error.message}`);
            return Response.json(
                {
                    code: "BAD_ENVIRONMENT",
                    message: "Some environment variables are missing or are invalid",
                    errors: parsedEnv.error,
                },
                { status: 500 },
            );
        }

        return app.fetch(req, parsedEnv.data, executionCtx);
    },

    queue: async (
        batch: MessageBatch<UserActionMessageBody>,
        env: Env,
        _executionContext: ExecutionContext,
    ) => {
        const logger = new ConsoleLogger({
            requestId: "queue",
            environment: env.ENVIRONMENT,
            application: "api",
            defaultFields: { environment: env.ENVIRONMENT },
        });

        switch (batch.queue) {
            case "key-migrations-development":
            case "key-migrations-preview":
            case "key-migrations-canary":
            case "key-migrations-production": {
                for (const message of batch.messages) {
                    // const result = await migrateKey(message.body, env);
                    // if (result.err) {
                    //     const delaySeconds = 2 ** message.attempts;
                    //     logger.error("Unable to migrate key", {
                    //         message,
                    //         error: result.err.message,
                    //         delaySeconds,
                    //     });
                    //     message.retry({ delaySeconds });
                    // } else {
                    //     message.ack();
                    // }
                    logger.info("processed message", {
                        message: message.body,
                    })
                    message.ack()
                }
                break;
            }
            case "key-migrations-development-dlq":
            case "key-migrations-preview-dlq":
            case "key-migrations-canary-dlq":
            case "key-migrations-production-dlq": {
                for (const message of batch.messages) {
                    // await storeMigrationError(message.body, env);
                    logger.info("processed message from dql", {
                        message: message.body,
                    })
                }
                break;
            }
            default:
                throw new Error(`No queue handler: ${batch.queue}`);
        }
    },
} satisfies ExportedHandler<Env, UserActionMessageBody>;

export default handler;
