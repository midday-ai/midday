type LogMessage = {
  msg: string;
  [key: string]: unknown;
};

/**
 * Simple structured logger for API using console
 */
export const logger = {
  debug: (message: LogMessage) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(JSON.stringify(message));
    }
  },

  info: (message: LogMessage) => {
    console.info(JSON.stringify(message));
  },

  warn: (message: LogMessage) => {
    console.warn(JSON.stringify(message));
  },

  error: (message: LogMessage) => {
    console.error(JSON.stringify(message));
  },
};
