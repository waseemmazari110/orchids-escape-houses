ALTER TABLE `user` ADD COLUMN `property_website` text;
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `plan_id` text;
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `payment_status` text DEFAULT 'pending';
