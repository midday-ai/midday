import type { Job } from "bullmq";

// ===============================
// Logger Configuration
// ===============================

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LOG_LEVEL =
  process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO;

// ===============================
// Logger Utilities
// ===============================

class WorkerLogger {
  private log(level: LogLevel, message: string, data?: any): void {
    if (level > LOG_LEVEL) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] [${levelName}]`;

    if (data) {
      console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, `❌ ${message}`, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, `⚠️ ${message}`, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, `ℹ️ ${message}`, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, `🐛 ${message}`, data);
  }

  // Specialized job logging methods
  jobStarted(job: Job): void {
    this.info("Job started", {
      id: job.id,
      name: job.name,
      queue: job.queueName,
      data: job.data,
    });
  }

  jobCompleted(job: Job, duration?: number): void {
    this.info("Job completed", {
      id: job.id,
      name: job.name,
      queue: job.queueName,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  jobFailed(job: Job, error: Error): void {
    this.error("Job failed", {
      id: job.id,
      name: job.name,
      queue: job.queueName,
      error: error.message,
      stack: error.stack,
      data: job.data,
    });
  }

  jobProgress(job: Job, progress: number): void {
    this.debug("Job progress updated", {
      id: job.id,
      name: job.name,
      progress: `${progress}%`,
    });
  }

  workerStarted(queueName: string, concurrency: number): void {
    this.info("Worker started", {
      queue: queueName,
      concurrency,
    });
  }

  workerStopped(queueName: string): void {
    this.info("Worker stopped", {
      queue: queueName,
    });
  }

  workerError(queueName: string, error: Error): void {
    this.error("Worker error", {
      queue: queueName,
      error: error.message,
      stack: error.stack,
    });
  }

  databaseConnected(): void {
    this.info("Database connected successfully");
  }

  serviceStarted(): void {
    this.info("🚀 Midday Worker Service started successfully");
  }

  serviceShuttingDown(): void {
    this.warn("🛑 Worker service shutting down...");
  }

  serviceShutdownComplete(): void {
    this.info("✅ Worker service shutdown complete");
  }
}

// Export singleton instance
export const logger = new WorkerLogger();
