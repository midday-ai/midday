enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

interface LogMetadata {
  [key: string]: any;
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;

  private static setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private static formatMessage(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
  ): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `${timestamp} [${level}] ${message}`;
    if (metadata) {
      formattedMessage += "\n" + JSON.stringify(metadata, null, 2);
    }
    return formattedMessage;
  }

  private static log(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
  ): void {
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(level, message, metadata);
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }
  }

  static error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.log(LogLevel.ERROR, message, {
      ...metadata,
      error: error?.stack || error?.message,
    });
  }

  static warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  static info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  static debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  static setLevel(level: keyof typeof LogLevel): void {
    this.setLogLevel(LogLevel[level]);
  }
}
