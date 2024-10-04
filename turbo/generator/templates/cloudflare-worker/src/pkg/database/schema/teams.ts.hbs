import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { businessAccounts } from "./business-accounts";
import { roles } from "./roles";
import { teamMembers } from "./team-members";

/**
 * Represents the teams table in the database.
 * This table stores information about teams within the system.
 *
 * @property {number} id - Unique identifier for the team.
 * @property {string} name - The name of the team. This field is required.
 * @property {string | null} description - An optional description of the team and its purpose.
 * @property {Date} createdAt - Timestamp indicating when the team was created. Defaults to the current time.
 * @property {Date} updatedAt - Timestamp indicating when the team was last updated. Defaults to the current time.
 * @property {number | null} teamAdminId - Foreign key referencing the business account that administers this team.
 *
 * @remarks
 * - Consider adding fields like 'isActive' or 'status' if you need to track the current state of teams.
 * - You might want to add a unique constraint on the 'name' field if team names should be unique across the system.
 */
export const teams = sqliteTable("teams", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
  teamAdminId: integer("team_admin_id").references(() => businessAccounts.id),
});

/**
 * Defines the relationships between the teams table and other tables in the database.
 *
 * @property {Relation} admin - One-to-one relationship with the businessAccounts table.
 *                              Represents the business account that administers this team.
 * @property {Relation} members - One-to-many relationship with the teamMembers table.
 *                                Represents all members (users and businesses) associated with this team.
 * @property {Relation} roles - One-to-many relationship with the roles table.
 *                              Represents the roles defined within this team.
 *
 * @remarks
 * - The 'admin' relationship allows for easy access to the team's administrator details.
 * - The 'members' relationship facilitates querying all members of a team, including both users and businesses.
 * - The 'roles' relationship allows for team-specific role management.
 */
export const teamsRelations = relations(teams, ({ one, many }) => ({
  admin: one(businessAccounts, {
    fields: [teams.teamAdminId],
    references: [businessAccounts.id],
  }),
  members: many(teamMembers),
  roles: many(roles),
}));

export type Team = typeof teams.$inferSelect; // return type when queried
export type NewTeam = typeof teams.$inferInsert; // insert type
