-- Migration: Add Membership System
-- Date: 2026-01-25
-- Description: Implements per-property membership packs with Bronze, Silver, Gold tiers

-- Create membership_packs table
CREATE TABLE IF NOT EXISTS `membership_packs` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `annual_price` real NOT NULL,
  `monthly_price` real NOT NULL,
  `vat_rate` real DEFAULT 20.00,
  `features` text NOT NULL,
  `minimum_commitment_months` integer DEFAULT 12,
  `display_order` integer,
  `is_active` integer DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

-- Create property_subscriptions table
CREATE TABLE IF NOT EXISTS `property_subscriptions` (
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
  `auto_renew` integer DEFAULT 1,
  `cancelled_at` text,
  `cancellation_reason` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`membership_pack_id`) REFERENCES `membership_packs`(`id`) ON UPDATE no action ON DELETE no action
);

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS `admin_activity_log` (
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

-- Add new columns to properties table
ALTER TABLE `properties` ADD COLUMN `property_type` text;
ALTER TABLE `properties` ADD COLUMN `address_line1` text;
ALTER TABLE `properties` ADD COLUMN `address_line2` text;
ALTER TABLE `properties` ADD COLUMN `city` text;
ALTER TABLE `properties` ADD COLUMN `county` text;
ALTER TABLE `properties` ADD COLUMN `postcode` text;
ALTER TABLE `properties` ADD COLUMN `country` text DEFAULT 'United Kingdom';
ALTER TABLE `properties` ADD COLUMN `minimum_stay_nights` integer DEFAULT 1;
ALTER TABLE `properties` ADD COLUMN `featured_image_url` text;
ALTER TABLE `properties` ADD COLUMN `images` text;
ALTER TABLE `properties` ADD COLUMN `amenities` text;
ALTER TABLE `properties` ADD COLUMN `membership_pack_id` text REFERENCES `membership_packs`(`id`);
ALTER TABLE `properties` ADD COLUMN `payment_frequency` text;
ALTER TABLE `properties` ADD COLUMN `payment_status` text DEFAULT 'unpaid';
ALTER TABLE `properties` ADD COLUMN `paid_at` text;
ALTER TABLE `properties` ADD COLUMN `submitted_for_approval_at` text;
ALTER TABLE `properties` ADD COLUMN `approved_at` text;
ALTER TABLE `properties` ADD COLUMN `rejected_at` text;
ALTER TABLE `properties` ADD COLUMN `published_at` text;
ALTER TABLE `properties` ADD COLUMN `paused_at` text;
ALTER TABLE `properties` ADD COLUMN `expired_at` text;
ALTER TABLE `properties` ADD COLUMN `approved_by_admin_id` text REFERENCES `user`(`id`);
ALTER TABLE `properties` ADD COLUMN `admin_notes` text;
ALTER TABLE `properties` ADD COLUMN `view_count` integer DEFAULT 0;
ALTER TABLE `properties` ADD COLUMN `enquiry_count` integer DEFAULT 0;

-- Update properties.status to use new lifecycle states
-- Note: Existing 'pending' statuses will be migrated to 'pending_approval'
UPDATE `properties` SET `status` = 'pending_approval' WHERE `status` = 'pending';
UPDATE `properties` SET `status` = 'live' WHERE `status` = 'approved';

-- Add new columns to payments table
ALTER TABLE `payments` ADD COLUMN `property_id` integer REFERENCES `properties`(`id`) ON DELETE SET NULL;
ALTER TABLE `payments` ADD COLUMN `property_subscription_id` integer REFERENCES `property_subscriptions`(`id`) ON DELETE SET NULL;
ALTER TABLE `payments` ADD COLUMN `stripe_customer_id` text;

-- Update enquiries table
ALTER TABLE `enquiries` ADD COLUMN `property_id` integer REFERENCES `properties`(`id`) ON DELETE CASCADE;
ALTER TABLE `enquiries` ADD COLUMN `guest_name` text;
ALTER TABLE `enquiries` ADD COLUMN `guest_email` text;
ALTER TABLE `enquiries` ADD COLUMN `guest_phone` text;
ALTER TABLE `enquiries` ADD COLUMN `check_in_date` text;
ALTER TABLE `enquiries` ADD COLUMN `check_out_date` text;
ALTER TABLE `enquiries` ADD COLUMN `number_of_guests` integer;
ALTER TABLE `enquiries` ADD COLUMN `owner_reply` text;
ALTER TABLE `enquiries` ADD COLUMN `replied_at` text;

-- Update enquiry status values
UPDATE `enquiries` SET `status` = 'new' WHERE `status` = 'sent';

-- Update user.role to support 'owner' and 'admin'
UPDATE `user` SET `role` = 'guest' WHERE `role` = 'customer';

-- Rename phone column to phoneNumber for Better Auth compatibility
-- Note: SQLite doesn't support direct column rename in older versions
-- If the column doesn't exist, this will be handled by the schema sync

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS `idx_properties_owner` ON `properties`(`owner_id`);
CREATE INDEX IF NOT EXISTS `idx_properties_status` ON `properties`(`status`);
CREATE INDEX IF NOT EXISTS `idx_properties_membership` ON `properties`(`membership_pack_id`);
CREATE INDEX IF NOT EXISTS `idx_property_subscriptions_property` ON `property_subscriptions`(`property_id`);
CREATE INDEX IF NOT EXISTS `idx_property_subscriptions_status` ON `property_subscriptions`(`status`);
CREATE INDEX IF NOT EXISTS `idx_property_subscriptions_dates` ON `property_subscriptions`(`start_date`, `end_date`);
CREATE INDEX IF NOT EXISTS `idx_payments_property` ON `payments`(`property_id`);
CREATE INDEX IF NOT EXISTS `idx_enquiries_property` ON `enquiries`(`property_id`);
CREATE INDEX IF NOT EXISTS `idx_enquiries_status` ON `enquiries`(`status`);
CREATE INDEX IF NOT EXISTS `idx_admin_activity_admin` ON `admin_activity_log`(`admin_id`);
CREATE INDEX IF NOT EXISTS `idx_admin_activity_entity` ON `admin_activity_log`(`entity_type`, `entity_id`);

-- Insert membership packs
INSERT OR REPLACE INTO `membership_packs` 
  (`id`, `name`, `description`, `annual_price`, `monthly_price`, `vat_rate`, `features`, `minimum_commitment_months`, `display_order`, `is_active`, `created_at`, `updated_at`)
VALUES
  (
    'bronze',
    'Bronze',
    'Annual Membership with Fully Optimised Listing',
    450.00,
    40.00,
    20.00,
    '{"listing":true,"pageBuild":false,"socialMedia":false,"blogFeature":false,"holidayPages":0,"homepageFeature":false,"specialistPage":false}',
    12,
    1,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'silver',
    'Silver',
    'All Bronze features plus page build, social media promotion, blog features, and holiday focus pages',
    650.00,
    57.00,
    20.00,
    '{"listing":true,"pageBuild":true,"socialMedia":true,"blogFeature":true,"holidayPages":3,"homepageFeature":false,"specialistPage":false}',
    12,
    2,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'gold',
    'Gold',
    'All Silver features plus homepage features and specialist pages (Weddings, Youth, or Business)',
    850.00,
    75.00,
    20.00,
    '{"listing":true,"pageBuild":true,"socialMedia":true,"blogFeature":true,"holidayPages":3,"homepageFeature":true,"specialistPage":true}',
    12,
    3,
    1,
    datetime('now'),
    datetime('now')
  );
