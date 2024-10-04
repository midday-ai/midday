import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { businessAccounts } from "./business-accounts";
import { teams } from "./teams";
import { userAccounts } from "./user-accounts";

/**
 * Represents the team_members table in the database.
 * This table manages the many-to-many relationship between teams, user accounts, and business accounts.
 *
 * @property {number} teamId - Foreign key referencing the associated team in the teams table.
 * @property {number} userAccountId - Foreign key referencing the associated user account in the userAccounts table.
 * @property {number} businessAccountId - Foreign key referencing the associated business account in the businessAccounts table.
 *
 * @remarks
 * - The combination of teamId, userAccountId, and businessAccountId forms a composite primary key.
 * - This structure allows for flexible team membership, where a user or business can be part of multiple teams,
 *   and a team can have multiple users and businesses as members.
 * - Consider adding additional fields like 'joinedAt' or 'role' to capture more information about team membership.
 */
export const teamMembers = sqliteTable(
  "team_members",
  {
    teamId: integer("team_id").references(() => teams.id),
    userAccountId: integer("user_account_id").references(() => userAccounts.id),
    businessAccountId: integer("business_account_id").references(
      () => businessAccounts.id,
    ),
  },
  (t) => ({
    pk: uniqueIndex("team_members_pkey").on(
      t.teamId,
      t.userAccountId,
      t.businessAccountId,
    ),
  }),
);

export type TeamMember = typeof teamMembers.$inferSelect; // return type when queried
export type NewTeamMember = typeof teamMembers.$inferInsert; // insert type
