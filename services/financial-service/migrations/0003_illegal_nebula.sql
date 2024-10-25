PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` integer,
	`last_used_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`scope` text DEFAULT '["read"]' NOT NULL,
	`rate_limit` integer DEFAULT 1000 NOT NULL,
	`allowed_ips` text DEFAULT '[]',
	`allowed_domains` text DEFAULT '[]',
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
INSERT INTO `__new_api_keys`("id", "user_id", "key", "name", "description", "created_at", "updated_at", "expires_at", "last_used_at", "is_active", "scope", "rate_limit", "allowed_ips", "allowed_domains", "usage_count", "last_used_ip", "environment", "revoked", "revoked_at", "revoked_reason", "key_id") SELECT "id", "user_id", "key", "name", "description", "created_at", "updated_at", "expires_at", "last_used_at", "is_active", "scope", "rate_limit", "allowed_ips", "allowed_domains", "usage_count", "last_used_ip", "environment", "revoked", "revoked_at", "revoked_reason", "key_id" FROM `api_keys`;--> statement-breakpoint
DROP TABLE `api_keys`;--> statement-breakpoint
ALTER TABLE `__new_api_keys` RENAME TO `api_keys`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `key_idx` ON `api_keys` (`key`);