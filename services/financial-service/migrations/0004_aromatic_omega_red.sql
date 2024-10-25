PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'developer',
	`avatar_url` text,
	`bio` text,
	`phone_number` text,
	`is_email_verified` integer DEFAULT false,
	`last_login_at` integer,
	`status` text DEFAULT 'pending_verification',
	`preferences` blob,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "name", "password_hash", "role", "avatar_url", "bio", "phone_number", "is_email_verified", "last_login_at", "status", "preferences", "created_at", "updated_at") SELECT "id", "email", "name", "password_hash", "role", "avatar_url", "bio", "phone_number", "is_email_verified", "last_login_at", "status", "preferences", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);