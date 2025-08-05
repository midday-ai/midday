import type { Database } from "@midday/db/client";
import {
  createActivity,
  markActivityAsRead,
  markAllActivitiesAsRead,
} from "@midday/db/queries";
import { type CreateActivityInput, createActivitySchema } from "./schemas";

export class Activities {
  constructor(private db: Database) {}

  async create(input: CreateActivityInput) {
    const data = createActivitySchema.parse(input);

    return createActivity(this.db, data);
  }

  /**
   * Mark a specific activity as read
   */
  async markAsRead(activityId: string) {
    return markActivityAsRead(this.db, activityId);
  }

  /**
   * Mark all activities as read for a team
   */
  async markAllAsRead(teamId: string, options?: { userId?: string }) {
    return markAllActivitiesAsRead(this.db, teamId, options);
  }
}
