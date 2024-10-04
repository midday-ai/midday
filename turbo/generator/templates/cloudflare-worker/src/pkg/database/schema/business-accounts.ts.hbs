import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { addresses } from "./addresses";
import { apiKeys } from "./api-keys";
import { businessAccountsTags } from "./business-account-tags";
import { profileTypeEnum } from "./enums";
import { roles } from "./roles";
import { settings } from "./settings";
import { teamMembers } from "./team-members";

/**
 * Represents the business_accounts table in the database.
 * This table stores essential information about business accounts.
 *
 * @property {number} id - Unique identifier for the business account.
 * @property {string} email - Business email address (unique and required).
 * @property {string | null} bio - Short biography of the business (max 200 characters).
 * @property {string | null} headline - Business headline or tagline.
 * @property {string | null} phoneNumber - Business phone number.
 * @property {number | null} authnAccountId - ID of the associated authentication account.
 * @property {boolean} isActive - Indicates if the account is active (default: true).
 * @property {string} username - Business's unique username (required).
 * @property {boolean} isPrivate - Indicates if the account is private (default: false).
 * @property {boolean} isEmailVerified - Indicates if the business email is verified (default: false).
 * @property {Date} createdAt - Timestamp of when the account was created.
 * @property {Date | null} verifiedAt - Timestamp of when the account was verified.
 * @property {string | null} companyEstablishedDate - Date when the company was established.
 * @property {string | null} companyIndustryType - Type of industry the company operates in.
 * @property {string | null} companyWebsiteUrl - URL of the company's website.
 * @property {string | null} companyDescription - Description of the company.
 * @property {string | null} companyName - Name of the company.
 * @property {ProfileType | null} accountType - Type of the business account.
 * @property {string | null} profileImageUrl - URL of the business's profile image.
 * @property {string | null} supabaseAuth0UserId - Unique identifier for Supabase Auth0 integration.
 * @property {string | null} algoliaUserId - Unique identifier for Algolia integration.
 */
export const businessAccounts = sqliteTable("business_accounts", {
  /** Unique identifier for the business account */
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  /** Business email address (unique and required) */
  email: text("email").notNull().unique(),
  /** Short biography of the business (max 200 characters) */
  bio: text("bio", { length: 200 }),
  /** Business headline or tagline */
  headline: text("headline"),
  /** Business phone number */
  phoneNumber: text("phone_number"),
  /** ID of the associated authentication account */
  authnAccountId: integer("authn_account_id"),
  /** Indicates if the account is active */
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  /** Business's unique username (required) */
  username: text("username", { length: 255 }).notNull().unique(),
  /** Indicates if the account is private */
  isPrivate: integer("is_private", { mode: "boolean" }).default(false),
  /** Indicates if the business email is verified */
  isEmailVerified: integer("is_email_verified", { mode: "boolean" }).default(
    false,
  ),
  /** Timestamp of when the account was created */
  createdAt: text("createdAt").default(sql`(CURRENT_TIMESTAMP)`),
  /** Timestamp of when the account was verified */
  verifiedAt: text("verifiedAt").default(sql`(CURRENT_TIMESTAMP)`),
  /** Date when the company was established */
  companyEstablishedDate: text("company_established_date"),
  /** Type of industry the company operates in */
  companyIndustryType: text("company_industry_type"),
  /** URL of the company's website */
  companyWebsiteUrl: text("company_website_url"),
  /** Description of the company */
  companyDescription: text("company_description"),
  /** Name of the company */
  companyName: text("company_name"),
  /** Type of the business account */
  accountType: profileTypeEnum,
  /** URL of the business's profile image */
  profileImageUrl: text("profile_image_url"),
  /** Unique identifier for Supabase Auth0 integration */
  supabaseAuth0UserId: text("supabase_auth0_user_id").unique(),
  /** Unique identifier for Algolia integration */
  algoliaUserId: text("algolia_user_id"),
});

/**
 * Defines the relationships between the businessAccounts table and other tables.
 *
 * @property {Relation} address - One-to-one relationship with the addresses table.
 * @property {Relation} tags - Many-to-many relationship with the tags table through businessAccountsTags.
 * @property {Relation} settings - One-to-one relationship with the settings table.
 * @property {Relation} teams - One-to-many relationship with the teamMembers table.
 * @property {Relation} roles - Many-to-many relationship with the roles table.
 * @property {Relation} apiKeys - One-to-many relationship with the apiKeys table.
 */
export const businessAccountsRelations = relations(
  businessAccounts,
  ({ one, many }) => ({
    address: one(addresses, {
      fields: [businessAccounts.id],
      references: [addresses.businessAccountId],
    }),
    tags: many(businessAccountsTags),
    settings: one(settings, {
      fields: [businessAccounts.id],
      references: [settings.businessAccountId],
    }),
    teams: many(teamMembers),
    roles: many(roles),
    apiKeys: many(apiKeys),
  }),
);

export type BusinessAccount = typeof businessAccounts.$inferSelect; // return type when queried
export type NewBusinessAccount = typeof businessAccounts.$inferInsert; // insert type
