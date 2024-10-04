CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text,
	`unit` text,
	`zipcode` text(5),
	`city` text,
	`state` text,
	`longitude` text,
	`latitude` text,
	`user_account_id` integer,
	`business_account_id` integer,
	FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`business_account_id`) REFERENCES `business_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text(64) NOT NULL,
	`name` text(255) NOT NULL,
	`api_key_status` text(3),
	`expires_at` text,
	`last_used_at` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP),
	`user_account_id` integer,
	`business_account_id` integer,
	FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_account_id`) REFERENCES `business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `business_accounts_tags` (
	`business_account_id` integer,
	`tag_id` integer,
	FOREIGN KEY (`business_account_id`) REFERENCES `business_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `business_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`bio` text(200),
	`headline` text,
	`phone_number` text,
	`authn_account_id` integer,
	`is_active` integer DEFAULT true,
	`username` text(255) NOT NULL,
	`is_private` integer DEFAULT false,
	`is_email_verified` integer DEFAULT false,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	`verifiedAt` text DEFAULT (CURRENT_TIMESTAMP),
	`company_established_date` text,
	`company_industry_type` text,
	`company_website_url` text,
	`company_description` text,
	`company_name` text,
	`profile_type` text(3),
	`profile_image_url` text,
	`supabase_auth0_user_id` text,
	`algolia_user_id` text
);
--> statement-breakpoint
CREATE TABLE `role_audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`audit_action` text(4),
	`performed_by` text NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	`affected_fields` text,
	`previous_values` text,
	`client_ip` text,
	`user_agent` text,
	`context` text,
	`role_id` integer,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`role_type` text(4),
	`can_create_users` integer DEFAULT false,
	`can_read_users` integer DEFAULT false,
	`can_update_users` integer DEFAULT false,
	`can_delete_users` integer DEFAULT false,
	`can_create_projects` integer DEFAULT false,
	`can_read_projects` integer DEFAULT false,
	`can_update_projects` integer DEFAULT false,
	`can_delete_projects` integer DEFAULT false,
	`can_create_reports` integer DEFAULT false,
	`can_read_reports` integer DEFAULT false,
	`can_update_reports` integer DEFAULT false,
	`can_delete_reports` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`team_id` integer,
	`user_account_id` integer,
	`business_account_id` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_account_id`) REFERENCES `business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tag_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_id` integer,
	`metadata` text NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_name` text(255) NOT NULL,
	`tag_description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`team_id` integer,
	`user_account_id` integer,
	`business_account_id` integer,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_account_id`) REFERENCES `business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`team_admin_id` integer,
	FOREIGN KEY (`team_admin_id`) REFERENCES `business_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_accounts_tags` (
	`user_account_id` integer,
	`tag_id` integer,
	FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`bio` text(200),
	`headline` text,
	`phone_number` text,
	`authn_account_id` integer,
	`is_active` integer DEFAULT true,
	`firstname` text,
	`lastname` text,
	`username` text NOT NULL,
	`is_private` integer DEFAULT false,
	`is_email_verified` integer DEFAULT false,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	`verifiedAt` text DEFAULT (CURRENT_TIMESTAMP),
	`profile_type` text(3),
	`profile_image_url` text,
	`supabase_auth0_user_id` text,
	`algolia_user_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_account_idx` ON `api_keys` (`user_account_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `business_account_idx` ON `api_keys` (`business_account_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `business_accounts_tags_pkey` ON `business_accounts_tags` (`business_account_id`,`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `business_accounts_email_unique` ON `business_accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `business_accounts_username_unique` ON `business_accounts` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `business_accounts_supabase_auth0_user_id_unique` ON `business_accounts` (`supabase_auth0_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_pkey` ON `team_members` (`team_id`,`user_account_id`,`business_account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_tags_pkey` ON `user_accounts_tags` (`user_account_id`,`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_email_unique` ON `user_accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_username_unique` ON `user_accounts` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_supabase_auth0_user_id_unique` ON `user_accounts` (`supabase_auth0_user_id`);
