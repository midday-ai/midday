import type { Job } from "bullmq";
import pino from "pino";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LOG_LEVEL =
  process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO;

// Configure Pino
const pinoLogger = pino({
  level: LOG_LEVEL === LogLevel.DEBUG ? "debug" : "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss dd-mm-yyyy",
      ignore: "pid,hostname",
    },
  },
});

class WorkerLogger {
  private pino = pinoLogger;

  error(message: string, data?: any): void {
    if (data) {
      this.pino.error(data, `❌ ${message}`);
    } else {
      this.pino.error(`❌ ${message}`);
    }
  }

  warn(message: string, data?: any): void {
    if (data) {
      this.pino.warn(data, `⚠️ ${message}`);
    } else {
      this.pino.warn(`⚠️ ${message}`);
    }
  }

  info(message: string, data?: any): void {
    if (data) {
      this.pino.info(data, `ℹ️  ${message}`);
    } else {
      this.pino.info(`ℹ️  ${message}`);
    }
  }

  debug(message: string, data?: any): void {
    if (data) {
      this.pino.debug(data, `🐛 ${message}`);
    } else {
      this.pino.debug(`🐛 ${message}`);
    }
  }

  jobStarted(job: Job): void {
    this.pino.info(
      {
        id: job.id,
        name: job.name,
        queue: job.queueName,
        data: job.data,
      },
      "Job started",
    );
  }

  jobCompleted(job: Job, duration?: number): void {
    this.pino.info(
      {
        id: job.id,
        name: job.name,
        queue: job.queueName,
        duration: duration ? `${duration}ms` : undefined,
      },
      "Job completed",
    );
  }

  jobFailed(job: Job, error: Error): void {
    this.pino.error(
      {
        id: job.id,
        name: job.name,
        queue: job.queueName,
        error: error.message,
        stack: error.stack,
        data: job.data,
      },
      "Job failed",
    );
  }

  jobProgress(job: Job, progress: number): void {
    this.pino.debug(
      {
        id: job.id,
        name: job.name,
        progress: `${progress}%`,
      },
      "Job progress updated",
    );
  }

  workerStarted(queueName: string, concurrency: number): void {
    this.pino.info(
      {
        queue: queueName,
        concurrency,
      },
      "Worker started",
    );
  }

  workerStopped(queueName: string): void {
    this.pino.info(
      {
        queue: queueName,
      },
      "Worker stopped",
    );
  }

  workerError(queueName: string, error: Error): void {
    this.pino.error(
      {
        queue: queueName,
        error: error.message,
        stack: error.stack,
      },
      "Worker error",
    );
  }

  databaseConnected(): void {
    this.pino.info("Database connected successfully");
  }

  serviceStarted(): void {
    this.pino.info("🚀 Worker service started successfully");
  }

  serviceShuttingDown(): void {
    this.pino.warn("🛑 Worker service shutting down...");
  }

  serviceShutdownComplete(): void {
    this.pino.info("✅ Worker service shutdown complete");
  }
}

// Export singleton instance
export const logger = new WorkerLogger();
