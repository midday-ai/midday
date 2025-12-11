import { nanoid } from "nanoid";

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
 */
interface BunWorker {
  postMessage(message: WorkerRequest): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerResponse>) => void,
  ): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  addEventListener(type: "close", listener: () => void): void;
  terminate(): void;
}

/**
 * Worker constructor type
 */
type WorkerConstructor = new (
  path: string,
  options?: { preload?: string[] },
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
  }> = [];

  constructor(private maxWorkers: number = MAX_WORKER_POOL_SIZE) {
    // Lazy initialization: Create workers on-demand instead of pre-creating
    // This reduces memory usage when idle and allows for better resource management
    // Start with 1 worker for immediate availability
    this.createWorker();
  }

  private createWorker(): BunWorker {
    // Use import.meta.path to get current file path, then resolve worker path
    const currentFile = import.meta.path;
    const workerPath = currentFile.replace(
      "pdf-to-img.ts",
      "pdf-to-img-worker.ts",
    );

    const worker = new WorkerClass(workerPath);

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
          console.warn(
            "Received response from wrong worker, ignoring",
            response.id,
          );
          return;
        }

        // Clear timeout
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.id);

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
      console.error("Worker error occurred:", {
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

      // Remove worker from pool
      this.removeWorker(worker);
    });

    // Handle worker exit/unexpected termination
    worker.addEventListener("close", () => {
      console.warn("Worker closed unexpectedly");
      this.removeWorker(worker);
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
    return worker;
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

      // Terminate the worker
      try {
        worker.terminate();
      } catch (terminateError) {
        console.error("Error terminating worker:", terminateError);
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

    // Wait for a worker to become available using a proper queue
    // This is more efficient than polling
    return new Promise<BunWorker>((resolve) => {
      this.workerQueue.push({
        resolve,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Notify waiting requests when a worker becomes available
   */
  private notifyWaitingRequests(): void {
    while (this.workerQueue.length > 0 && this.availableWorkers.length > 0) {
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
    // Get worker (this will queue if all workers are busy)
    const worker = await this.getAvailableWorker();
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
            console.warn("PDF conversion timed out", {
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
        };
        this.pendingRequests.set(id, pendingRequest);

        try {
          // Send conversion request to worker
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
          console.error("Failed to send message to worker:", errorMessage);
          reject(
            new Error(`Failed to send conversion request: ${errorMessage}`),
          );
        }
      },
    );
  }

  /**
   * Get pool statistics for monitoring
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.workerQueue.length,
      maxWorkers: this.maxWorkers,
    };
  }

  /**
   * Cleanup all workers (call on shutdown)
   */
  terminate(): void {
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
        console.error("Error terminating worker during cleanup:", error);
      }
    }
    this.workers = [];
    this.availableWorkers = [];
  }
}

// Singleton worker pool instance
let workerPool: WorkerPool | null = null;

function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    workerPool = new WorkerPool(MAX_WORKER_POOL_SIZE);
    // Log pool initialization for monitoring
    console.log("PDF Worker Pool initialized", {
      maxWorkers: MAX_WORKER_POOL_SIZE,
      maxConcurrent: CONFIG.MAX_CONCURRENT_CONVERSIONS,
      maxPdfSizeMB: CONFIG.MAX_PDF_SIZE / (1024 * 1024),
      environment: process.env.NODE_ENV || "development",
    });
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
    console.error(`PDF too large for conversion: ${data.byteLength} bytes`);
    return null;
  }

  try {
    const pool = getWorkerPool();
    const result = await pool.convert(data, options);

    if (!result) {
      console.error("PDF to image conversion failed or timed out", {
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
      console.error(
        "PDF to image conversion failed due to memory constraints:",
        {
          size: data.byteLength,
        },
      );
      return null;
    }

    console.error("PDF to image conversion error:", {
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
