CREATE TABLE `pilot_routes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`stops` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `reports` ADD `trip` text DEFAULT '{}' NOT NULL;