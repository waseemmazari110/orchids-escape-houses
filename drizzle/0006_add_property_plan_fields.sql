-- Migration: Add per-property plan fields
-- Date: 2026-01-26
-- Description: Add plan and payment tracking fields to properties table

-- Add plan_id column
ALTER TABLE properties ADD COLUMN plan_id TEXT;

-- Add payment_status column
ALTER TABLE properties ADD COLUMN payment_status TEXT DEFAULT 'pending';

-- Add stripe_payment_intent_id column
ALTER TABLE properties ADD COLUMN stripe_payment_intent_id TEXT;

-- Add plan_purchased_at column
ALTER TABLE properties ADD COLUMN plan_purchased_at TEXT;

-- Add plan_expires_at column
ALTER TABLE properties ADD COLUMN plan_expires_at TEXT;
