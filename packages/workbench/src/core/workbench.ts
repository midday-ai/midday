import type { Queue } from "bullmq";
import { QueueManager } from "./queue-manager";
import type { WorkbenchOptions } from "./types";

/**
 * Core Workbench class that manages the dashboard
 */
export class WorkbenchCore {
  readonly options: Required<Pick<WorkbenchOptions, "title" | "readonly">> &
    WorkbenchOptions;
  readonly queueManager: QueueManager;

  constructor(options: WorkbenchOptions | Queue[]) {
    // Handle array shorthand
    const opts = Array.isArray(options) ? { queues: options } : options;

    this.options = {
      title: "Workbench",
      readonly: false,
      ...opts,
    };

    if (!this.options.queues || this.options.queues.length === 0) {
      throw new Error(
        "Workbench requires at least one queue. Pass queues directly or provide a redis connection for auto-discovery.",
      );
    }

    this.queueManager = new QueueManager(
      this.options.queues,
      this.options.tags || [],
    );
  }

  /**
   * Get the queue manager instance
   */
  getQueueManager(): QueueManager {
    return this.queueManager;
  }

  /**
   * Check if authentication is required
   */
  requiresAuth(): boolean {
    return !!(this.options.auth?.username && this.options.auth?.password);
  }

  /**
   * Validate authentication credentials
   */
  validateAuth(username: string, password: string): boolean {
    if (!this.requiresAuth()) return true;
    return (
      username === this.options.auth?.username &&
      password === this.options.auth?.password
    );
  }

  /**
   * Get dashboard configuration for the UI
   */
  getConfig() {
    return {
      title: this.options.title,
      logo: this.options.logo,
      readonly: this.options.readonly,
      queues: this.queueManager.getQueueNames(),
      tags: this.queueManager.getTagFields(),
    };
  }
}
