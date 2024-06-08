export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { BaselimeSDK, VercelPlugin, BetterHttpInstrumentation } =
      await import("@baselime/node-opentelemetry");

    const sdk = new BaselimeSDK({
      serverless: true,
      service: process.env.BASELIME_SERVICE,
      instrumentations: [
        new BetterHttpInstrumentation({
          plugins: [new VercelPlugin()],
        }),
      ],
      baselimeKey: process.env.BASELIME_KEY,
    });

    sdk.start();
  }
}
