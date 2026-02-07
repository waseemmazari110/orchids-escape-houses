CREATE TABLE `admin_activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`details` text,
	`ip_address` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crm_activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`outcome` text,
	`performed_by` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text NOT NULL,
	`phone` text,
	`address` text,
	`city` text,
	`postcode` text,
	`country` text,
	`business_name` text,
	`tax_id` text,
	`bank_details` text,
	`company_name` text,
	`event_type` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_contacted_at` text,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crm_contacts_email_unique` ON `crm_contacts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `crm_contacts_user_id_unique` ON `crm_contacts` (`user_id`);--> statement-breakpoint
CREATE TABLE `crm_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`property_id` text,
	`status` text DEFAULT 'new' NOT NULL,
	`message` text,
	`guest_email` text,
	`guest_phone` text,
	`guest_name` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `crm_contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `crm_properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `crm_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`related_property_id` text,
	`related_enquiry_id` text,
	`type` text NOT NULL,
	`subject` text,
	`content` text,
	`direction` text,
	`initiated_by` text,
	`created_at` text NOT NULL,
	`read_at` text,
	`metadata` text,
	FOREIGN KEY (`contact_id`) REFERENCES `crm_contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_property_id`) REFERENCES `crm_properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`related_enquiry_id`) REFERENCES `crm_enquiries`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `crm_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`plan_tier` text NOT NULL,
	`plan_price` real,
	`billing_cycle` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`renewal_date` text,
	`cancelled_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`last_payment_date` text,
	`last_payment_amount` real,
	`next_payment_date` text,
	`auto_renew` integer DEFAULT true NOT NULL,
	`payment_failure_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`contact_id`) REFERENCES `crm_contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `crm_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`property_id` integer NOT NULL,
	`title` text NOT NULL,
	`location` text,
	`bedrooms` integer,
	`bathrooms` integer,
	`max_guests` integer,
	`price_per_night` real,
	`listing_status` text,
	`membership_tier` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`enquiry_count` integer DEFAULT 0 NOT NULL,
	`booking_count` integer DEFAULT 0 NOT NULL,
	`total_revenue` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text,
	`expires_at` text,
	`internal_notes` text,
	`rejection_reason` text,
	FOREIGN KEY (`owner_id`) REFERENCES `crm_contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `crm_segments` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text NOT NULL,
	`segment` text NOT NULL,
	`lifetime_value` real,
	`engagement_score` integer,
	`added_at` text NOT NULL,
	`removed_at` text,
	FOREIGN KEY (`contact_id`) REFERENCES `crm_contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`enquiry_type` text DEFAULT 'general' NOT NULL,
	`source` text DEFAULT 'website',
	`status` text DEFAULT 'new' NOT NULL,
	`priority` text DEFAULT 'medium',
	`assigned_to` text,
	`property_id` integer,
	`check_in_date` text,
	`check_out_date` text,
	`number_of_guests` integer,
	`occasion` text,
	`budget` real,
	`preferred_locations` text,
	`special_requests` text,
	`referral_source` text,
	`marketing_consent` integer DEFAULT false,
	`ip_address` text,
	`user_agent` text,
	`admin_notes` text,
	`internal_notes` text,
	`response_template` text,
	`responded_at` text,
	`responded_by` text,
	`resolved_at` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `membership_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`annual_price` real NOT NULL,
	`monthly_price` real NOT NULL,
	`vat_rate` real DEFAULT 20,
	`features` text NOT NULL,
	`minimum_commitment_months` integer DEFAULT 12,
	`display_order` integer,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`property_id` integer,
	`booking_id` integer,
	`subscription_id` integer,
	`property_subscription_id` integer,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'GBP',
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`stripe_payment_intent_id` text,
	`stripe_charge_id` text,
	`stripe_subscription_id` text,
	`stripe_customer_id` text,
	`method` text,
	`payment_method` text,
	`payment_method_brand` text,
	`payment_method_last4` text,
	`description` text,
	`billing_reason` text,
	`receipt_email` text,
	`receipt_url` text,
	`failure_message` text,
	`processed_at` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`property_subscription_id`) REFERENCES `property_subscriptions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `property_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` integer NOT NULL,
	`membership_pack_id` text NOT NULL,
	`payment_frequency` text NOT NULL,
	`base_price` real NOT NULL,
	`vat_amount` real NOT NULL,
	`total_price` real NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`stripe_subscription_id` text,
	`stripe_payment_intent_id` text,
	`auto_renew` integer DEFAULT true,
	`cancelled_at` text,
	`cancellation_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`membership_pack_id`) REFERENCES `membership_packs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `saved_properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`property_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `saved_quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`quote_payload` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `spam_blacklist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`reason` text,
	`expires_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spam_blacklist_value_unique` ON `spam_blacklist` (`value`);--> statement-breakpoint
CREATE TABLE `spam_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text,
	`email` text,
	`form_type` text,
	`reason` text,
	`user_agent` text,
	`payload` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`plan_name` text,
	`plan_type` text,
	`amount` real,
	`interval` text,
	`status` text DEFAULT 'active' NOT NULL,
	`stripe_subscription_id` text,
	`current_period_start` text,
	`current_period_end` text,
	`canceled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX "blog_posts_slug_unique";--> statement-breakpoint
DROP INDEX "crm_contacts_email_unique";--> statement-breakpoint
DROP INDEX "crm_contacts_user_id_unique";--> statement-breakpoint
DROP INDEX "destinations_slug_unique";--> statement-breakpoint
DROP INDEX "experiences_slug_unique";--> statement-breakpoint
DROP INDEX "properties_slug_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "spam_blacklist_value_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `properties` ALTER COLUMN "is_published" TO "is_published" integer DEFAULT false;--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `destinations_slug_unique` ON `destinations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `experiences_slug_unique` ON `experiences` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `properties_slug_unique` ON `properties` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `properties` ADD `owner_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `properties` ADD `property_type` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `address_line1` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `address_line2` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `city` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `county` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `postcode` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `country` text DEFAULT 'United Kingdom';--> statement-breakpoint
ALTER TABLE `properties` ADD `minimum_stay_nights` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `properties` ADD `featured_image_url` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `images` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `amenities` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `membership_pack_id` text REFERENCES membership_packs(id);--> statement-breakpoint
ALTER TABLE `properties` ADD `payment_frequency` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `payment_status` text DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `properties` ADD `paid_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `submitted_for_approval_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `approved_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `rejected_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `published_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `paused_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `expired_at` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `approved_by_admin_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `properties` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `admin_notes` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `view_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `properties` ADD `enquiry_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `properties` ADD `plan` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `stripe_subscription_id` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `stripe_price_id` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `stripe_invoice_id` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `next_payment_date` text;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `user` ADD `company_name` text;--> statement-breakpoint
ALTER TABLE `user` ADD `property_website` text;--> statement-breakpoint
ALTER TABLE `user` ADD `plan_id` text;--> statement-breakpoint
ALTER TABLE `user` ADD `payment_status` text DEFAULT 'pending';