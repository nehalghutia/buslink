CREATE TABLE `reports` (
	`token` text PRIMARY KEY NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`accuracy` real NOT NULL,
	`updated` integer NOT NULL,
	`history` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_updated_idx` ON `reports` (`updated`);