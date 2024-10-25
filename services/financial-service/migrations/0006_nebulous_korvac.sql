PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_preferences` (
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
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_preferences`("id", "user_id", "service_tier", "compliance_level", "default_api_version", "webhook_url", "webhook_events", "sandbox_mode", "test_data_enabled", "max_requests_per_second", "max_transactions_per_day", "max_accounts_per_user", "email_notification_api_key", "email_notification_quota", "email_notification_security", "email_notification_compliance", "transaction_alert_threshold", "transaction_alert_enabled", "ip_whitelist", "mfa_enabled", "audit_log_retention", "created_at", "updated_at") SELECT "id", "user_id", "service_tier", "compliance_level", "default_api_version", "webhook_url", "webhook_events", "sandbox_mode", "test_data_enabled", "max_requests_per_second", "max_transactions_per_day", "max_accounts_per_user", "email_notification_api_key", "email_notification_quota", "email_notification_security", "email_notification_compliance", "transaction_alert_threshold", "transaction_alert_enabled", "ip_whitelist", "mfa_enabled", "audit_log_retention", "created_at", "updated_at" FROM `user_preferences`;--> statement-breakpoint
DROP TABLE `user_preferences`;--> statement-breakpoint
ALTER TABLE `__new_user_preferences` RENAME TO `user_preferences`;--> statement-breakpoint
PRAGMA foreign_keys=ON;