import { createLoggerWithContext } from "@midday/logger";
import { nanoid } from "nanoid";

const logger = createLoggerWithContext("pdf-to-img");

/**
 * Worker message types for communication between main thread and worker
 */
type WorkerRequest = {
  id: string;
  type: "convert";
  data: ArrayBuffer;
  options?: {
    quality?: number;
  };
};

type WorkerSuccessResponse = {
  id: string;
  type: "success";
  buffer: ArrayBuffer;
  contentType: string;
};

type WorkerErrorResponse = {
  id: string;
  type: "error";
  error: string;
};

type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

/**
 * Bun Worker interface - matches Bun's Worker API
 * Includes Bun-specific events like "open"
 */
interface BunWorker {
  postMessage(message: WorkerRequest): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  addEventListener(type: "close", listener: (event: CloseEvent) => void): void;
  addEventListener(type: "open", listener: () => void): void; // Bun-specific event
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void;
  removeEventListener(
    type: "error",
    listener: (event: ErrorEvent) => void,
  ): void;
  removeEventListener(
    type: "close",
    listener: (event: CloseEvent) => void,
  ): void;
  removeEventListener(type: "open", listener: () => void): void;
  terminate(): void;
}

/**
 * Worker constructor type
 * Includes Bun-specific options like smol and preload
 */
type WorkerConstructor = new (
  path: string,
  options?: {
    preload?: string | string[];
    smol?: boolean;
    ref?: boolean;
  },
) => BunWorker;

/**
 * Get Worker constructor from global scope
 * Worker is a global in Bun, accessible via globalThis or directly
 */
function getWorkerConstructor(): WorkerConstructor {
  // Try globalThis first (most reliable)
  if (typeof globalThis !== "undefined" && "Worker" in globalThis) {
    return (globalThis as { Worker: WorkerConstructor }).Worker;
  }

  // Try direct Worker access
  if (typeof Worker !== "undefined") {
    return Worker as unknown as WorkerConstructor;
  }

  throw new Error(
    "Worker API is not available. Please ensure you're running Bun with worker support.",
  );
}

const WorkerClass = getWorkerConstructor();

/**
 * Configuration based on environment and infrastructure
 * Production: 4GB RAM, 2 CPUs -> can handle more workers
 * Staging: 2GB RAM, 1 CPU -> more conservative
 */
function getPdfConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  // Allow environment variable overrides
  const envWorkerPoolSize = process.env.PDF_WORKER_POOL_SIZE
    ? Number.parseInt(process.env.PDF_WORKER_POOL_SIZE, 10)
    : undefined;
  const envMaxConcurrent = process.env.PDF_MAX_CONCURRENT_CONVERSIONS
    ? Number.parseInt(process.env.PDF_MAX_CONCURRENT_CONVERSIONS, 10)
    : undefined;
  const envMaxPdfSize = process.env.PDF_MAX_SIZE_MB
    ? Number.parseInt(process.env.PDF_MAX_SIZE_MB, 10) * 1024 * 1024
    : undefined;

  // Dynamic sizing based on environment
  // Production: 4GB RAM, 2 CPUs -> can handle 4-5 workers comfortably
  // Staging: 2GB RAM, 1 CPU -> use 2-3 workers
  const defaultWorkerPoolSize = isProduction ? 4 : 2;
  const defaultMaxConcurrent = isProduction ? 8 : 4;

  // PDF size limits - production can handle larger files
  const defaultMaxPdfSize = isProduction
    ? 30 * 1024 * 1024 // 30MB in production
    : 20 * 1024 * 1024; // 20MB in staging/dev

  return {
    MAX_WORKER_POOL_SIZE: envWorkerPoolSize ?? defaultWorkerPoolSize,
    MAX_CONCURRENT_CONVERSIONS: envMaxConcurrent ?? defaultMaxConcurrent,
    MAX_PDF_SIZE: envMaxPdfSize ?? defaultMaxPdfSize,
    PREVIEW_QUALITY: 70, // Lower quality for smaller file size and faster processing
    WORKER_TIMEOUT_MS: 15000, // 15 seconds - increased for larger files
    WORKER_INTERNAL_TIMEOUT_MS: 12000, // 12 seconds for worker internal timeout
  };
}

const CONFIG = getPdfConfig();

const MAX_PDF_SIZE = CONFIG.MAX_PDF_SIZE;
const PREVIEW_QUALITY = CONFIG.PREVIEW_QUALITY;
const WORKER_TIMEOUT_MS = CONFIG.WORKER_TIMEOUT_MS;
const MAX_WORKER_POOL_SIZE = CONFIG.MAX_WORKER_POOL_SIZE;

/**
 * Error classification for retry logic
 */
type ErrorCategory =
  | "timeout"
  | "worker_error"
  | "memory"
  | "validation"
  | "corrupted"
  | "unknown";

interface ClassifiedError {
  category: ErrorCategory;
  retryable: boolean;
}

/**
 * Classify errors to determine if they should be retried
 */
function classifyPdfError(error: unknown): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "";

  // Timeout errors - retryable
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("aborted") ||
    errorName === "TimeoutError" ||
    errorName === "AbortError"
  ) {
    return { category: "timeout", retryable: true };
  }

  // Worker errors - retryable (worker might recover)
  if (
    errorMessage.includes("Worker error") ||
    errorMessage.includes("worker") ||
    errorMessage.includes("postMessage")
  ) {
    return { category: "worker_error", retryable: true };
  }

  // Memory errors - not retryable (will fail again)
  if (
    errorMessage.includes("out of memory") ||
    errorMessage.includes("ENOMEM") ||
    errorMessage.includes("allocation failed") ||
    errorMessage.includes("Cannot allocate memory")
  ) {
    return { category: "memory", retryable: false };
  }

  // Validation errors - not retryable
  if (
    errorMessage.includes("too large") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("malformed")
  ) {
    return { category: "validation", retryable: false };
  }

  // Corrupted PDF errors - not retryable
  if (
    errorMessage.includes("corrupted") ||
    errorMessage.includes("parse") ||
    errorMessage.includes("InvalidArg")
  ) {
    return { category: "corrupted", retryable: false };
  }

  // Unknown errors - treat as potentially retryable (conservative)
  return { category: "unknown", retryable: true };
}

/**
 * Retry wrapper with exponential backoff
 */
async function convertWithRetry(
  data: ArrayBuffer,
  options?: { quality?: number },
  maxRetries = 2,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const pool = getWorkerPool();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.convert(data, options);

      if (!result && attempt < maxRetries) {
        // Null result might be timeout - retry
        const delay = 500 * 2 ** attempt + Math.random() * 100;
        logger.warn(
          `PDF conversion returned null (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms`,
          {
            size: data.byteLength,
          },
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return result;
    } catch (error) {
      const classified = classifyPdfError(error);

      // Don't retry on last attempt or non-retryable errors
      if (attempt === maxRetries || !classified.retryable) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = 500 * 2 ** attempt + Math.random() * 100;
      console.warn(
        `PDF conversion failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`,
        {
          error: error instanceof Error ? error.message : String(error),
          category: classified.category,
          size: data.byteLength,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Worker pool for managing PDF conversion workers
 * Limits concurrent conversions to prevent VM crashes
 */
/**
 * Pending request tracking with worker association
 */
interface PendingRequest {
  resolve: (value: { buffer: Buffer; contentType: string } | null) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  worker: BunWorker;
  startTime: number;
}

/**
 * Worker health tracking
 */
interface WorkerHealth {
  worker: BunWorker;
  successCount: number;
  failureCount: number;
  totalProcessingTime: number;
  requestCount: number;
  lastFailureTime: number | null;
  isHealthy: boolean;
}

/**
 * Calculate worker health metrics
 */
function calculateWorkerHealth(health: WorkerHealth): {
  isHealthy: boolean;
  failureRate: number;
  avgProcessingTime: number;
} {
  const totalRequests = health.successCount + health.failureCount;
  const failureRate =
    totalRequests > 0 ? health.failureCount / totalRequests : 0;
  const avgProcessingTime =
    health.requestCount > 0
      ? health.totalProcessingTime / health.requestCount
      : 0;

  // Mark unhealthy if:
  // - Failure rate > 20%
  // - Average processing time > 10 seconds (likely stuck)
  // - More than 3 failures in a row
  const isHealthy =
    failureRate <= 0.2 &&
    avgProcessingTime <= 10000 &&
    (health.lastFailureTime === null ||
      Date.now() - health.lastFailureTime > 30000); // Not failed recently

  return { isHealthy, failureRate, avgProcessingTime };
}

/**
 * Worker pool for managing PDF conversion workers
 * Limits concurrent conversions to prevent VM crashes
 */
class WorkerPool {
  private workers: BunWorker[] = [];
  private availableWorkers: BunWorker[] = [];
  private pendingRequests = new Map<string, PendingRequest>();
  private workerQueue: Array<{
    resolve: (worker: BunWorker) => void;
    timestamp: number;
    priority: number;
    fileSize: number;
  }> = [];
  private workerHealth = new Map<BunWorker, WorkerHealth>();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(private maxWorkers: number = MAX_WORKER_POOL_SIZE) {
    // Pre-create workers based on environment
    // Production: start with 2 workers, staging: start with 1
    const initialWorkers = process.env.NODE_ENV === "production" ? 2 : 1;
    for (let i = 0; i < initialWorkers; i++) {
      this.createWorker();
    }

    // Start health check interval (check every 30 seconds)
    this.healthCheckInterval = setInterval(() => {
      this.checkWorkerHealth();
    }, 30000);
  }

  private createWorker(): BunWorker {
    // Use new URL() pattern for better path resolution (Bun best practice)
    // This ensures the worker path is resolved correctly relative to the current file
    const workerUrl = new URL("pdf-to-img-worker.ts", import.meta.url).href;

    // Create worker with optimized options
    // Consider smol: true for memory-constrained environments (disabled by default for performance)
    const worker = new WorkerClass(workerUrl, {
      // smol: true, // Uncomment for memory-constrained environments (reduces memory usage at cost of performance)
    });

    // Listen for "open" event (Bun-specific) to know when worker is ready
    // Messages are automatically enqueued until ready, so this is optional but useful for monitoring
    worker.addEventListener("open", () => {
      logger.debug("Worker opened and ready", {
        workerCount: this.workers.length,
      });
    });

    worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;

        const pending = this.pendingRequests.get(response.id);
        if (!pending) {
          return;
        }

        // Verify this response is from the correct worker
        if (pending.worker !== worker) {
          logger.warn("Received response from wrong worker, ignoring", {
            id: response.id,
          });
          return;
        }

        // Clear timeout
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.id);

        // Track worker health
        const health = this.workerHealth.get(worker);
        if (health) {
          const processingTime = Date.now() - pending.startTime;
          health.requestCount++;
          health.totalProcessingTime += processingTime;

          if (response.type === "success") {
            health.successCount++;
          } else {
            health.failureCount++;
            health.lastFailureTime = Date.now();
          }
        }

        // Return worker to pool
        this.availableWorkers.push(worker);
        // Notify any waiting requests
        this.notifyWaitingRequests();

        if (response.type === "success") {
          // Convert ArrayBuffer back to Buffer
          const buffer = Buffer.from(response.buffer);
          pending.resolve({
            buffer,
            contentType: response.contentType,
          });
        } else {
          pending.reject(new Error(response.error));
        }
      },
    );

    worker.addEventListener("error", (error: ErrorEvent) => {
      logger.error("Worker error occurred", {
        error: error.message || "Unknown error",
        workerCount: this.workers.length,
        availableWorkers: this.availableWorkers.length,
        pendingRequests: this.pendingRequests.size,
      });

      // Find and reject pending requests for this specific worker only
      const errorMessage = error.message || "Unknown worker error";
      const requestsToReject: string[] = [];

      for (const [id, pending] of this.pendingRequests.entries()) {
        if (pending.worker === worker) {
          requestsToReject.push(id);
        }
      }

      for (const id of requestsToReject) {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(id);
          pending.reject(new Error(`Worker error: ${errorMessage}`));
        }
      }

      // Track failure in health
      const health = this.workerHealth.get(worker);
      if (health) {
        health.failureCount++;
        health.lastFailureTime = Date.now();
      }

      // Remove worker from pool
      this.removeWorker(worker);
    });

    // Handle worker exit/unexpected termination
    // Bun's "close" event includes exit code (0 if normal, non-zero if error)
    worker.addEventListener("close", (event: CloseEvent) => {
      const exitCode = (event as unknown as { code?: number }).code ?? 0;
      if (exitCode !== 0) {
        logger.warn("Worker closed with non-zero exit code", {
          exitCode,
          workerCount: this.workers.length,
        });
      } else {
        logger.debug("Worker closed normally", {
          workerCount: this.workers.length,
        });
      }
      const health = this.workerHealth.get(worker);
      if (health) {
        health.failureCount++;
        health.lastFailureTime = Date.now();
      }
      this.removeWorker(worker);
    });

    // Initialize health tracking for this worker
    this.workerHealth.set(worker, {
      worker,
      successCount: 0,
      failureCount: 0,
      totalProcessingTime: 0,
      requestCount: 0,
      lastFailureTime: null,
      isHealthy: true,
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
    return worker;
  }

  /**
   * Check worker health and remove unhealthy workers
   */
  private checkWorkerHealth(): void {
    const workersToRemove: BunWorker[] = [];

    for (const [worker, health] of this.workerHealth.entries()) {
      const metrics = calculateWorkerHealth(health);

      if (!metrics.isHealthy && health.requestCount >= 3) {
        // Only remove if we have enough data (at least 3 requests)
        logger.warn("Removing unhealthy worker", {
          failureRate: metrics.failureRate.toFixed(2),
          avgProcessingTime: metrics.avgProcessingTime.toFixed(0),
          requestCount: health.requestCount,
        });
        workersToRemove.push(worker);
      } else {
        // Update health status
        health.isHealthy = metrics.isHealthy;
      }
    }

    // Remove unhealthy workers
    for (const worker of workersToRemove) {
      this.removeWorker(worker);
    }

    // Ensure we have minimum workers
    const minWorkers = process.env.NODE_ENV === "production" ? 2 : 1;
    while (
      this.workers.length < minWorkers &&
      this.workers.length < this.maxWorkers
    ) {
      this.createWorker();
    }
  }

  /**
   * Remove a worker from the pool and create a replacement if needed
   */
  private removeWorker(worker: BunWorker): void {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
      const availableIndex = this.availableWorkers.indexOf(worker);
      if (availableIndex > -1) {
        this.availableWorkers.splice(availableIndex, 1);
      }

      // Remove health tracking
      this.workerHealth.delete(worker);

      // Terminate the worker
      try {
        worker.terminate();
      } catch (terminateError) {
        logger.error("Error terminating worker", {
          error:
            terminateError instanceof Error
              ? terminateError.message
              : String(terminateError),
        });
      }

      // Create replacement worker if we're below max
      if (this.workers.length < this.maxWorkers) {
        this.createWorker();
      }
    }
  }

  private async getAvailableWorker(): Promise<BunWorker> {
    // If we have an available worker, use it immediately
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop()!;
    }

    // If we haven't reached max workers, create a new one
    if (this.workers.length < this.maxWorkers) {
      return this.createWorker();
    }

    // Wait for a worker to become available using a priority queue
    // Smaller files get processed first for better throughput
    return new Promise<BunWorker>((resolve) => {
      // Calculate priority based on a default file size estimate
      // We don't know the actual size yet, so use medium priority
      // The actual priority will be used when notifying
      this.workerQueue.push({
        resolve,
        timestamp: Date.now(),
        priority: 2, // Default to medium priority
        fileSize: 0, // Will be updated if known
      });
    });
  }

  /**
   * Get available worker with priority-based queuing
   */
  private async getAvailableWorkerWithPriority(
    fileSize: number,
  ): Promise<BunWorker> {
    // If we have an available worker, use it immediately
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop()!;
    }

    // If we haven't reached max workers, create a new one
    if (this.workers.length < this.maxWorkers) {
      return this.createWorker();
    }

    // Wait for a worker with priority-based queuing
    const priority = this.calculatePriority(fileSize);
    return new Promise<BunWorker>((resolve) => {
      this.workerQueue.push({
        resolve,
        timestamp: Date.now(),
        priority,
        fileSize,
      });
      // Re-sort queue to ensure priority order
      this.notifyWaitingRequests();
    });
  }

  /**
   * Calculate priority for a request based on file size
   * Smaller files get higher priority (lower number = higher priority)
   */
  private calculatePriority(fileSize: number): number {
    // Small files (< 1MB): priority 1
    if (fileSize < 1024 * 1024) {
      return 1;
    }
    // Medium files (1-10MB): priority 2
    if (fileSize < 10 * 1024 * 1024) {
      return 2;
    }
    // Large files (> 10MB): priority 3
    return 3;
  }

  /**
   * Notify waiting requests when a worker becomes available
   * Processes requests by priority (smaller files first)
   */
  private notifyWaitingRequests(): void {
    while (this.workerQueue.length > 0 && this.availableWorkers.length > 0) {
      // Sort queue by priority (lower number = higher priority), then by timestamp
      this.workerQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.timestamp - b.timestamp;
      });

      const waiter = this.workerQueue.shift();
      if (waiter) {
        const worker = this.availableWorkers.pop()!;
        waiter.resolve(worker);
      }
    }
  }

  async convert(
    data: ArrayBuffer,
    options?: { quality?: number },
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    // Get worker with priority-based queuing (smaller files first)
    const worker = await this.getAvailableWorkerWithPriority(data.byteLength);
    const id = nanoid();

    // Adaptive timeout based on file size
    // Larger files need more time, but cap at reasonable limit
    const fileSizeMB = data.byteLength / (1024 * 1024);
    const adaptiveTimeout = Math.min(
      WORKER_TIMEOUT_MS + Math.floor(fileSizeMB * 500), // +500ms per MB
      WORKER_TIMEOUT_MS * 2, // Cap at 2x base timeout
    );

    return new Promise<{ buffer: Buffer; contentType: string } | null>(
      (resolve, reject) => {
        // Set up adaptive timeout
        const timeout = setTimeout(() => {
          const pending = this.pendingRequests.get(id);
          if (pending) {
            this.pendingRequests.delete(id);
            // Return worker to pool
            this.availableWorkers.push(worker);
            // Notify any waiting requests
            this.notifyWaitingRequests();
            logger.warn("PDF conversion timed out", {
              id,
              size: data.byteLength,
              sizeMB: fileSizeMB.toFixed(2),
              timeout: adaptiveTimeout,
              queueLength: this.workerQueue.length,
            });
            resolve(null);
          }
        }, adaptiveTimeout);

        // Store pending request with worker association
        const pendingRequest: PendingRequest = {
          resolve,
          reject,
          timeout,
          worker,
          startTime: Date.now(),
        };
        this.pendingRequests.set(id, pendingRequest);

        try {
          // Send conversion request to worker
          // Bun's postMessage has optimized fast paths for simple objects (2-241x faster)
          // Our message structure (id, type, data, options) qualifies for the simple object fast path
          // when options only contains primitives, which it does (quality is a number)
          worker.postMessage({
            id,
            type: "convert",
            data,
            options,
          });
        } catch (error) {
          // Clean up on send error
          clearTimeout(timeout);
          this.pendingRequests.delete(id);
          this.availableWorkers.push(worker);
          // Notify any waiting requests
          this.notifyWaitingRequests();
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Failed to send message to worker", {
            error: errorMessage,
          });
          reject(
            new Error(`Failed to send conversion request: ${errorMessage}`),
          );
        }
      },
    );
  }

  /**
   * Warmup workers by initializing libraries with a minimal test PDF
   * This reduces first-request latency
   */
  async warmupWorkers(): Promise<void> {
    const warmupPromises = this.workers.map(async (worker) => {
      try {
        // Create a minimal valid PDF for warmup
        const minimalPdf = Buffer.from(
          "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 1 1]\n/Contents 4 0 R\n/Resources <<\n/ProcSet [/PDF]\n>>\n>>\nendobj\n4 0 obj\n<<\n/Length 10\n>>\nstream\nq\nQ\nendstream\nendobj\nxref\n0 5\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n200\n%%EOF",
        );

        const warmupId = nanoid();
        const warmupPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Warmup timeout"));
          }, 5000);

          const messageHandler = (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;
            if (response.id === warmupId) {
              clearTimeout(timeout);
              worker.removeEventListener("message", messageHandler);
              if (response.type === "success") {
                resolve();
              } else {
                // Warmup failures are non-critical
                resolve();
              }
            }
          };

          worker.addEventListener("message", messageHandler);

          try {
            worker.postMessage({
              id: warmupId,
              type: "convert",
              data: minimalPdf.buffer,
              options: { quality: 50 },
            });
          } catch (error) {
            clearTimeout(timeout);
            worker.removeEventListener("message", messageHandler);
            // Warmup failures are non-critical
            resolve();
          }
        });

        await warmupPromise;
      } catch (error) {
        // Warmup failures are non-critical - log but don't fail
        logger.warn("Worker warmup failed (non-critical)", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats() {
    const healthStats = Array.from(this.workerHealth.values()).map((health) => {
      const metrics = calculateWorkerHealth(health);
      return {
        successCount: health.successCount,
        failureCount: health.failureCount,
        failureRate: metrics.failureRate,
        avgProcessingTime: metrics.avgProcessingTime,
        requestCount: health.requestCount,
        isHealthy: metrics.isHealthy,
      };
    });

    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.workerQueue.length,
      maxWorkers: this.maxWorkers,
      workerHealth: healthStats,
    };
  }

  /**
   * Cleanup all workers (call on shutdown)
   */
  terminate(): void {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear all pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Worker pool terminated"));
    }
    this.pendingRequests.clear();

    // Reject all queued requests
    for (const waiter of this.workerQueue) {
      waiter.resolve = () => {}; // No-op to prevent errors
    }
    this.workerQueue = [];

    // Terminate all workers
    for (const worker of this.workers) {
      try {
        worker.terminate();
      } catch (error) {
        logger.error("Error terminating worker during cleanup", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    this.workers = [];
    this.availableWorkers = [];
    this.workerHealth.clear();
  }
}

// Singleton worker pool instance
let workerPool: WorkerPool | null = null;

function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    workerPool = new WorkerPool(MAX_WORKER_POOL_SIZE);
    // Log pool initialization for monitoring
    logger.info("PDF Worker Pool initialized", {
      maxWorkers: MAX_WORKER_POOL_SIZE,
      maxConcurrent: CONFIG.MAX_CONCURRENT_CONVERSIONS,
      maxPdfSizeMB: CONFIG.MAX_PDF_SIZE / (1024 * 1024),
      environment: process.env.NODE_ENV || "development",
    });

    // Warmup workers asynchronously (don't block initialization)
    // This initializes PDF and Sharp libraries to reduce first-request latency
    if (process.env.NODE_ENV === "production") {
      const pool = workerPool; // Capture reference before async operation
      setTimeout(async () => {
        if (pool) {
          try {
            await pool.warmupWorkers();
            logger.info("Worker warmup completed");
          } catch (error) {
            logger.warn("Worker warmup failed (non-critical)", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }, 1000); // Wait 1 second after initialization
    }
  }
  return workerPool;
}

/**
 * Get worker pool statistics for monitoring/debugging
 */
export function getPdfWorkerStats() {
  if (!workerPool) {
    return null;
  }
  return workerPool.getStats();
}

/**
 * Convert PDF buffer to JPEG image buffer (first page only)
 * Uses worker threads for process isolation to prevent VM crashes
 * Optimized for single-page previews: lower scale, quality, and max dimensions
 * Cloudflare CDN handles resizing, so we optimize for speed and memory efficiency
 * @param data - PDF file as ArrayBuffer
 * @param options - Optional quality settings
 * @returns Object with image buffer and content type, or null if conversion fails
 */
export async function getPdfImage(
  data: ArrayBuffer,
  options?: {
    quality?: number;
  },
): Promise<{ buffer: Buffer; contentType: string } | null> {
  // Check file size before processing to prevent memory issues
  if (data.byteLength > MAX_PDF_SIZE) {
    logger.error("PDF too large for conversion", {
      size: data.byteLength,
      maxSize: MAX_PDF_SIZE,
    });
    return null;
  }

  try {
    // Use retry wrapper for transient failures
    const result = await convertWithRetry(data, options);

    if (!result) {
      logger.error("PDF to image conversion failed after retries", {
        size: data.byteLength,
      });
      return null;
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for memory-related errors
    const isMemoryError =
      errorMessage.includes("out of memory") ||
      errorMessage.includes("ENOMEM") ||
      errorMessage.includes("allocation failed") ||
      errorMessage.includes("Cannot allocate memory");

    if (isMemoryError) {
      logger.error("PDF to image conversion failed due to memory constraints", {
        size: data.byteLength,
      });
      return null;
    }

    logger.error("PDF to image conversion error", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return null instead of throwing to prevent crashes
    return null;
  }
}

/**
 * Cleanup function to terminate worker pool (call on shutdown)
 */
export function cleanupPdfWorkers(): void {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
  }
}
