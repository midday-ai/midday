CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`service_tier` text DEFAULT 'starter' NOT NULL,
	`compliance_level` text DEFAULT 'basic' NOT NULL,
	`default_api_version` text DEFAULT 'v1',
	`webhook_url` text,
	`webhook_events` blob,
	`sandbox_mode` integer DEFAULT true,
	`test_data_enabled` integer DEFAULT true,
	`max_requests_per_second` integer DEFAULT 10,
	`max_transactions_per_day` integer DEFAULT 1000,
	`max_accounts_per_user` integer DEFAULT 5,
	`email_notification_api_key` integer DEFAULT true,
	`email_notification_quota` integer DEFAULT true,
	`email_notification_security` integer DEFAULT true,
	`email_notification_compliance` integer DEFAULT true,
	`transaction_alert_threshold` integer DEFAULT 10000,
	`transaction_alert_enabled` integer DEFAULT true,
	`ip_whitelist` blob,
	`mfa_enabled` integer DEFAULT false,
	`audit_log_retention` integer DEFAULT 365,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `preferences`;