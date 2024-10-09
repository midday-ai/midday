CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` integer,
	`last_used_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`scope` text DEFAULT 'default' NOT NULL,
	`rate_limit` integer DEFAULT 1000 NOT NULL,
	`allowed_ips` text,
	`allowed_domains` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`last_used_ip` text,
	`environment` text DEFAULT 'development' NOT NULL,
	`revoked` integer DEFAULT false NOT NULL,
	`revoked_at` integer,
	`revoked_reason` text,
	`key_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_id_idx` ON `api_keys` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `key_idx` ON `api_keys` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `expiration_idx` ON `api_keys` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `environment_idx` ON `api_keys` (`environment`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user',
	`avatar_url` text,
	`bio` text,
	`phone_number` text,
	`is_email_verified` integer DEFAULT false,
	`last_login_at` integer,
	`status` text DEFAULT 'active',
	`preferences` blob,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);