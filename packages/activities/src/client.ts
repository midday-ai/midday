import type { Database } from "@midday/db/client";
import {
  createActivity,
  updateActivityStatus,
  updateAllActivitiesStatus,
} from "@midday/db/queries";
import { type CreateActivityInput, createActivitySchema } from "./schemas";

export class Activities {
  constructor(private db: Database) {}

  async create(input: CreateActivityInput) {
    const data = createActivitySchema.parse(input);

    return createActivity(this.db, data);
  }

  /**
   * Update the status of a specific activity
   */
  async updateStatus(
    activityId: string,
    status: "unread" | "read" | "archived",
  ) {
    return updateActivityStatus(this.db, activityId, status);
  }

  /**
   * Update the status of all activities for a team
   */
  async updateAllStatus(
    teamId: string,
    status: "unread" | "read" | "archived",
    options?: { userId?: string },
  ) {
    return updateAllActivitiesStatus(this.db, teamId, status, options);
  }
}
