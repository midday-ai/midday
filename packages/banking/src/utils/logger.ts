import { createLoggerWithContext } from "@midday/logger";

const bankingLogger = createLoggerWithContext("banking");

export const logger = (message: string, ...rest: string[]) => {
  bankingLogger.info(message, {
    details: rest.length > 0 ? rest.join(" ") : undefined,
  });
};
