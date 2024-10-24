import { ConsoleLogger } from "./logger";

export class LoggerSingleton {
  private static instance: ConsoleLogger;

  private constructor() {}

  public static getInstance(
    requestId: string = "base-request",
    defaultFields: Record<string, any> = { default: "field" },
  ): ConsoleLogger {
    if (!LoggerSingleton.instance || requestId !== "base-request") {
      LoggerSingleton.instance = new ConsoleLogger({
        requestId,
        environment: "production",
        application: "api",
        defaultFields,
      });
    }
    return LoggerSingleton.instance;
  }
}
