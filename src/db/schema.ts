import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyName: text('property_name').notNull(),
  propertyLocation: text('property_location'),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone').notNull(),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date').notNull(),
  numberOfGuests: integer('number_of_guests').notNull(),
  occasion: text('occasion'),
  bookingStatus: text('booking_status').notNull().default('pending'),
  totalPrice: real('total_price'),
  depositAmount: real('deposit_amount'),
  depositPaid: integer('deposit_paid', { mode: 'boolean' }).default(false),
  balanceAmount: real('balance_amount'),
  balancePaid: integer('balance_paid', { mode: 'boolean' }).default(false),
  specialRequests: text('special_requests'),
  experiencesSelected: text('experiences_selected', { mode: 'json' }),
  adminNotes: text('admin_notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
    role: text("role").notNull().default("guest"),
    // Possible values: 'guest', 'owner', 'admin'
    phoneNumber: text("phone"),
    propertyName: text("company_name"),
    companyName: text("company_name"),
  propertyWebsite: text("property_website"),
  planId: text("plan_id"),
  paymentStatus: text("payment_status").default("pending"),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// CMS Tables

// Membership Packs Configuration Table
export const membershipPacks = sqliteTable('membership_packs', {
  id: text('id').primaryKey(), // 'bronze', 'silver', 'gold'
  name: text('name').notNull(), // 'Bronze', 'Silver', 'Gold'
  description: text('description'),
  
  // Pricing
  annualPrice: real('annual_price').notNull(), // £450, £650, £850
  monthlyPrice: real('monthly_price').notNull(), // £40, £57, £75
  vatRate: real('vat_rate').default(20.00), // 20% VAT
  
  // Features (stored as JSON)
  features: text('features', { mode: 'json' }).notNull(),
  
  // Constraints
  minimumCommitmentMonths: integer('minimum_commitment_months').default(12),
  
  // Display
  displayOrder: integer('display_order'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Properties table
export const properties = sqliteTable('properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: text('owner_id').references(() => user.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  propertyType: text('property_type'), // 'Manor House', 'Farmhouse', etc.
  location: text('location').notNull(),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  county: text('county'),
  postcode: text('postcode'),
  country: text('country').default('United Kingdom'),
  region: text('region').notNull(),
  sleepsMin: integer('sleeps_min').notNull(),
  sleepsMax: integer('sleeps_max').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  priceFromMidweek: real('price_from_midweek').notNull(),
  priceFromWeekend: real('price_from_weekend').notNull(),
  minimumStayNights: integer('minimum_stay_nights').default(1),
  description: text('description').notNull(),
  houseRules: text('house_rules'),
  checkInOut: text('check_in_out'),
  iCalURL: text('ical_url'),
  
  // Media
  heroImage: text('hero_image').notNull(),
  heroVideo: text('hero_video'),
  floorplanURL: text('floorplan_url'),
  featuredImageUrl: text('featured_image_url'),
  images: text('images', { mode: 'json' }), // Array of image URLs
  
  // Location
  mapLat: real('map_lat'),
  mapLng: real('map_lng'),
  
  // Amenities (stored as JSON)
  amenities: text('amenities', { mode: 'json' }),
  
  // Contact
  ownerContact: text('owner_contact'),
  
  // Membership
  membershipPackId: text('membership_pack_id').references(() => membershipPacks.id),
  paymentFrequency: text('payment_frequency'), // 'annual' or 'monthly'
  
  // Status & Lifecycle
  status: text('status').notNull().default('draft'),
  // Possible values: 'draft', 'pending_approval', 'live', 'rejected', 'paused', 'expired'
  
  paymentStatus: text('payment_status').default('unpaid'),
  // Possible values: 'unpaid', 'paid', 'refunded', 'failed'
  
  // Timestamps
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  paidAt: text('paid_at'),
  submittedForApprovalAt: text('submitted_for_approval_at'),
  approvedAt: text('approved_at'),
  rejectedAt: text('rejected_at'),
  publishedAt: text('published_at'),
  pausedAt: text('paused_at'),
  expiredAt: text('expired_at'),
  
  // Admin
  approvedByAdminId: text('approved_by_admin_id').references(() => user.id),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  
  // Analytics
  viewCount: integer('view_count').default(0),
  enquiryCount: integer('enquiry_count').default(0),
  
  // Legacy fields (for backward compatibility)
  featured: integer('featured', { mode: 'boolean' }).default(false),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  plan: text('plan'),
  planId: text('plan_id'),
  planPurchasedAt: text('plan_purchased_at'),
  planExpiresAt: text('plan_expires_at'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  stripeInvoiceId: text('stripe_invoice_id'),
  nextPaymentDate: text('next_payment_date'),
});

// Property images table
export const propertyImages = sqliteTable('property_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  imageURL: text('image_url').notNull(),
  caption: text('caption'),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').notNull(),
});

// Property features table
export const propertyFeatures = sqliteTable('property_features', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  featureName: text('feature_name').notNull(),
  createdAt: text('created_at').notNull(),
});

// Experiences table
export const experiences = sqliteTable('experiences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  duration: text('duration').notNull(),
  groupSizeMin: integer('group_size_min').notNull(),
  groupSizeMax: integer('group_size_max').notNull(),
  priceFrom: real('price_from').notNull(),
  description: text('description').notNull(),
  included: text('included', { mode: 'json' }),
  whatToProvide: text('what_to_provide', { mode: 'json' }),
  heroImage: text('hero_image').notNull(),
  category: text('category'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Experience images table
export const experienceImages = sqliteTable('experience_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  experienceId: integer('experience_id').notNull().references(() => experiences.id, { onDelete: 'cascade' }),
  imageURL: text('image_url').notNull(),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').notNull(),
});

// Experience FAQs table
export const experienceFaqs = sqliteTable('experience_faqs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  experienceId: integer('experience_id').notNull().references(() => experiences.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').notNull(),
});

// Destinations table
export const destinations = sqliteTable('destinations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cityName: text('city_name').notNull(),
  slug: text('slug').notNull().unique(),
  region: text('region').notNull(),
  overview: text('overview').notNull(),
  travelTips: text('travel_tips'),
  topVenues: text('top_venues', { mode: 'json' }),
  heroImage: text('hero_image').notNull(),
  mapArea: text('map_area'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Destination images table
export const destinationImages = sqliteTable('destination_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  destinationId: integer('destination_id').notNull().references(() => destinations.id, { onDelete: 'cascade' }),
  imageURL: text('image_url').notNull(),
  caption: text('caption'),
  orderIndex: integer('order_index').default(0),
  createdAt: text('created_at').notNull(),
});

// Reviews table
export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guestName: text('guest_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  propertyId: integer('property_id').references(() => properties.id),
  reviewDate: text('review_date').notNull(),
  guestImage: text('guest_image'),
  isApproved: integer('is_approved', { mode: 'boolean' }).default(false),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Blog posts table
export const blogPosts = sqliteTable('blog_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  body: text('body').notNull(),
  featuredImage: text('featured_image').notNull(),
  category: text('category').notNull(),
  tags: text('tags', { mode: 'json' }),
  author: text('author').notNull(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// FAQs table
export const faqs = sqliteTable('faqs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull(),
  orderIndex: integer('order_index').default(0),
  isPublished: integer('is_published', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Partners table
export const partners = sqliteTable('partners', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  region: text('region'),
  website: text('website'),
  contactEmail: text('contact_email'),
  commissionNotes: text('commission_notes'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Saved properties table
export const savedProperties = sqliteTable('saved_properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
});

// Payments table (for tracking payment transactions)
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  propertySubscriptionId: integer('property_subscription_id').references(() => propertySubscriptions.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),
  currency: text('currency').default('GBP'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeChargeId: text('stripe_charge_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  method: text('method'), // 'stripe', 'card', etc
  paymentMethod: text('payment_method'),
  paymentMethodBrand: text('payment_method_brand'),
  paymentMethodLast4: text('payment_method_last4'),
  description: text('description'),
  billingReason: text('billing_reason'), // 'booking_deposit', 'booking_balance', 'property_membership', etc
  receiptEmail: text('receipt_email'),
  receiptUrl: text('receipt_url'),
  failureMessage: text('failure_message'),
  processedAt: text('processed_at'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Property Subscriptions (Tracks membership periods for properties)
export const propertySubscriptions = sqliteTable('property_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  membershipPackId: text('membership_pack_id').notNull().references(() => membershipPacks.id),
  
  // Subscription details
  paymentFrequency: text('payment_frequency').notNull(), // 'annual', 'monthly'
  
  // Pricing at time of purchase (historical record)
  basePrice: real('base_price').notNull(),
  vatAmount: real('vat_amount').notNull(),
  totalPrice: real('total_price').notNull(),
  
  // Period
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(), // Always 12 months from start
  
  // Status
  status: text('status').notNull().default('active'),
  // Possible values: 'active', 'expired', 'cancelled', 'upgraded'
  
  // Payment tracking
  stripeSubscriptionId: text('stripe_subscription_id'), // If monthly
  stripePaymentIntentId: text('stripe_payment_intent_id'), // If annual
  
  // Renewal
  autoRenew: integer('auto_renew', { mode: 'boolean' }).default(true),
  cancelledAt: text('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Subscriptions table (for tracking owner memberships - legacy)
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull(),
  planName: text('plan_name'),
  planType: text('plan_type'), // 'standard', 'premium', etc
  amount: real('amount'),
  interval: text('interval'), // 'month', 'year', etc
  status: text('status').notNull().default('active'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: text('current_period_start'),
  currentPeriodEnd: text('current_period_end'),
  canceledAt: text('canceled_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Saved quotes table
export const savedQuotes = sqliteTable('saved_quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  quotePayload: text('quote_payload', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
});

// Enquiries table
export const enquiries = sqliteTable('enquiries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  enquiryType: text('enquiry_type').notNull().default('general'),
  source: text('source').default('website'),
  status: text('status').notNull().default('new'),
  priority: text('priority').default('medium'),
  assignedTo: text('assigned_to'),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  checkInDate: text('check_in_date'),
  checkOutDate: text('check_out_date'),
  numberOfGuests: integer('number_of_guests'),
  occasion: text('occasion'),
  budget: real('budget'),
  preferredLocations: text('preferred_locations'),
  specialRequests: text('special_requests'),
  referralSource: text('referral_source'),
  marketingConsent: integer('marketing_consent', { mode: 'boolean' }).default(false),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  adminNotes: text('admin_notes'),
  internalNotes: text('internal_notes'),
  responseTemplate: text('response_template'),
  respondedAt: text('responded_at'),
  respondedBy: text('responded_by'),
  resolvedAt: text('resolved_at'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Spam protection tables
export const spamBlacklist = sqliteTable('spam_blacklist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'ip' or 'email'
  value: text('value').notNull().unique(),
  reason: text('reason'),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull(),
});

export const spamSubmissions = sqliteTable('spam_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ip: text('ip'),
  email: text('email'),
  formType: text('form_type'),
  reason: text('reason'),
  userAgent: text('user_agent'),
  payload: text('payload', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
});

// Admin Activity Log
export const adminActivityLog = sqliteTable('admin_activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: text('admin_id').notNull().references(() => user.id),
  action: text('action').notNull(), // 'approve_property', 'reject_property', etc.
  entityType: text('entity_type'), // 'property', 'user', 'payment'
  entityId: text('entity_id'),
  details: text('details', { mode: 'json' }),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull(),
});

// ============================================
// CUSTOM CRM SYSTEM TABLES
// ============================================

// CRM Contacts (Owner/Guest Contact Records)
export const crmContacts = sqliteTable('crm_contacts', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'owner' | 'guest'
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  postcode: text('postcode'),
  country: text('country'),
  
  // Owner specific fields
  businessName: text('business_name'),
  taxId: text('tax_id'),
  bankDetails: text('bank_details'), // JSON
  
  // Guest specific fields
  companyName: text('company_name'),
  eventType: text('event_type'), // 'birthday', 'wedding', 'corporate', etc
  
  // Common fields
  status: text('status').notNull().default('active'), // 'active' | 'inactive' | 'blocked'
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  lastContactedAt: text('last_contacted_at'),
  
  // Foreign key
  userId: text('user_id').unique().references(() => user.id, { onDelete: 'set null' }),
});

// CRM Properties (Property Record in CRM)
export const crmProperties = sqliteTable('crm_properties', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => crmContacts.id, { onDelete: 'cascade' }),
  propertyId: integer('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  
  // Property Info (denormalized for quick access)
  title: text('title').notNull(),
  location: text('location'),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  maxGuests: integer('max_guests'),
  pricePerNight: real('price_per_night'),
  
  // Status
  listingStatus: text('listing_status'), // 'draft' | 'pending_approval' | 'live' | 'paused' | 'rejected'
  membershipTier: text('membership_tier'), // 'bronze' | 'silver' | 'gold'
  
  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  enquiryCount: integer('enquiry_count').notNull().default(0),
  bookingCount: integer('booking_count').notNull().default(0),
  totalRevenue: real('total_revenue').notNull().default(0),
  
  // Timeline
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'),
  expiresAt: text('expires_at'),
  
  // Notes
  internalNotes: text('internal_notes'),
  rejectionReason: text('rejection_reason'),
});

// CRM Enquiries (All Enquiries/Interactions)
export const crmEnquiries = sqliteTable('crm_enquiries', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').references(() => crmContacts.id, { onDelete: 'cascade' }),
  propertyId: text('property_id').references(() => crmProperties.id, { onDelete: 'cascade' }),
  
  status: text('status').notNull().default('new'),
  message: text('message'),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  guestName: text('guest_name'),
  createdAt: text('created_at').notNull(),
});

// CRM Memberships (Membership/Subscription Tracking)
export const crmMemberships = sqliteTable('crm_memberships', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => crmContacts.id, { onDelete: 'cascade' }),
  
  // Plan Details
  planTier: text('plan_tier').notNull(), // 'bronze' | 'silver' | 'gold'
  planPrice: real('plan_price'),
  billingCycle: text('billing_cycle'), // 'annual' | 'monthly'
  
  // Dates
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  renewalDate: text('renewal_date'),
  cancelledDate: text('cancelled_date'),
  
  // Status
  status: text('status').notNull().default('active'), // 'active' | 'expiring_soon' | 'expired' | 'cancelled' | 'suspended'
  
  // Payment Info
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  lastPaymentDate: text('last_payment_date'),
  lastPaymentAmount: real('last_payment_amount'),
  nextPaymentDate: text('next_payment_date'),
  
  // Auto-renewal
  autoRenew: integer('auto_renew', { mode: 'boolean' }).notNull().default(true),
  paymentFailureCount: integer('payment_failure_count').notNull().default(0),
  
  // Tracking
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  
  // Notes
  notes: text('notes'),
});

// CRM Interactions (Communication/Activity Log)
export const crmInteractions = sqliteTable('crm_interactions', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => crmContacts.id, { onDelete: 'cascade' }),
  relatedPropertyId: text('related_property_id').references(() => crmProperties.id, { onDelete: 'set null' }),
  relatedEnquiryId: text('related_enquiry_id').references(() => crmEnquiries.id, { onDelete: 'set null' }),
  
  // Interaction Type
  type: text('type').notNull(), // 'email' | 'phone' | 'message' | 'note' | 'status_change'
  subject: text('subject'),
  content: text('content'),
  
  // Direction
  direction: text('direction'), // 'inbound' | 'outbound' | 'internal'
  initiatedBy: text('initiated_by'), // 'contact' | 'owner' | 'admin' | 'system'
  
  // Timeline
  createdAt: text('created_at').notNull(),
  readAt: text('read_at'),
  
  // Metadata
  metadata: text('metadata'), // JSON for flexible data storage
});

// CRM Activity Log (Admin Actions & System Events)
export const crmActivityLog = sqliteTable('crm_activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(), // 'contact' | 'property' | 'enquiry' | 'membership'
  entityId: text('entity_id').notNull(),
  activityType: text('activity_type').notNull(), // 'created' | 'updated' | 'deleted' | 'status_changed'
  title: text('title').notNull(),
  description: text('description'),
  outcome: text('outcome'),
  performedBy: text('performed_by'),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').notNull(),
});

// CRM Segments (Owner Segmentation for Marketing)
export const crmSegments = sqliteTable('crm_segments', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => crmContacts.id, { onDelete: 'cascade' }),
  
  // Segment Tags
  segment: text('segment').notNull(), // 'high_value' | 'churning' | 'at_risk' | 'premium' | 'inactive'
  
  // Scoring
  lifetimeValue: real('lifetime_value'),
  engagementScore: integer('engagement_score'), // 0-100
  
  // Dates
  addedAt: text('added_at').notNull(),
  removedAt: text('removed_at'),
});

// Plan Purchases (tracks purchased plans before property creation)
export const planPurchases = sqliteTable('plan_purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  amount: real('amount').notNull(),
  purchasedAt: text('purchased_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used').default(0).notNull(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  usedAt: text('used_at'),
  createdAt: text('created_at').notNull(),
});
