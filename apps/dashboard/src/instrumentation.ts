export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    // const { BaselimeSDK, VercelPlugin, BetterHttpInstrumentation } =
    //   await import("@baselime/node-opentelemetry");

    // const sdk = new BaselimeSDK({
    //   serverless: true,
    //   service: process.env.BASELIME_SERVICE,
    //   instrumentations: [
    //     new BetterHttpInstrumentation({
    //       plugins: [new VercelPlugin()],
    //     }),
    //   ],
    // });

    // sdk.start();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
