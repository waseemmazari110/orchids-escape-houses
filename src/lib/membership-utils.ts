/**
 * Membership System Utilities
 * 
 * Business logic for property membership packs including:
 * - Pack features and pricing
 * - Property lifecycle states
 * - Payment calculations
 * - State transitions
 */

import { membershipPacks, properties, propertySubscriptions } from '@/db/schema';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MembershipPackFeatures {
  listing: boolean;
  pageBuild: boolean;
  socialMedia: boolean;
  blogFeature: boolean;
  holidayPages: number;
  homepageFeature: boolean;
  specialistPage: boolean;
}

export interface MembershipPack {
  id: 'bronze' | 'silver' | 'gold';
  name: string;
  description: string;
  annualPrice: number;
  monthlyPrice: number;
  vatRate: number;
  features: MembershipPackFeatures;
  minimumCommitmentMonths: number;
  displayOrder: number;
  isActive: boolean;
}

export interface PricingCalculation {
  basePrice: number;
  vatAmount: number;
  totalPrice: number;
  frequency: 'annual' | 'monthly';
  packId: string;
  packName: string;
  totalOver12Months?: number;
  savingsVsMonthly?: number;
}

export interface PropertyFeatures {
  hasListing: boolean;
  hasPageBuild: boolean;
  hasSocialMedia: boolean;
  hasBlogFeature: boolean;
  holidayPagesCount: number;
  hasHomepageFeature: boolean;
  hasSpecialistPage: boolean;
  canReceiveEnquiries: boolean;
  isSearchable: boolean;
  showOnMap: boolean;
}

// Property lifecycle states
export type PropertyStatus = 
  | 'draft'
  | 'pending_approval'
  | 'live'
  | 'rejected'
  | 'paused'
  | 'expired';

export type PaymentStatus = 
  | 'unpaid'
  | 'paid'
  | 'refunded'
  | 'failed';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'upgraded';

// ============================================================================
// Pricing Calculations
// ============================================================================

/**
 * Calculate pricing for a membership pack
 */
export function calculatePackPricing(
  pack: MembershipPack,
  frequency: 'annual' | 'monthly'
): PricingCalculation {
  const basePrice = frequency === 'annual' ? pack.annualPrice : pack.monthlyPrice;
  const vatAmount = basePrice * (pack.vatRate / 100);
  const totalPrice = basePrice + vatAmount;

  const calculation: PricingCalculation = {
    basePrice,
    vatAmount,
    totalPrice,
    frequency,
    packId: pack.id,
    packName: pack.name,
  };

  // Add comparison metrics
  if (frequency === 'annual') {
    const monthlyTotal = pack.monthlyPrice * 12;
    calculation.totalOver12Months = totalPrice;
    calculation.savingsVsMonthly = monthlyTotal - basePrice;
  } else {
    calculation.totalOver12Months = totalPrice * 12;
    calculation.savingsVsMonthly = -(pack.annualPrice - (basePrice * 12));
  }

  return calculation;
}

/**
 * Calculate total for multiple properties checkout
 */
export function calculateMultiPropertyTotal(
  items: Array<{ pack: MembershipPack; frequency: 'annual' | 'monthly' }>
): {
  items: PricingCalculation[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  hasRecurring: boolean;
  recurringMonthly?: number;
} {
  const calculations = items.map(item => 
    calculatePackPricing(item.pack, item.frequency)
  );

  const annualItems = calculations.filter(c => c.frequency === 'annual');
  const monthlyItems = calculations.filter(c => c.frequency === 'monthly');

  const annualSubtotal = annualItems.reduce((sum, c) => sum + c.basePrice, 0);
  const monthlySubtotal = monthlyItems.reduce((sum, c) => sum + c.basePrice, 0);
  
  const annualVat = annualItems.reduce((sum, c) => sum + c.vatAmount, 0);
  const monthlyVat = monthlyItems.reduce((sum, c) => sum + c.vatAmount, 0);

  return {
    items: calculations,
    subtotal: annualSubtotal + monthlySubtotal,
    totalVat: annualVat + monthlyVat,
    grandTotal: (annualSubtotal + annualVat) + (monthlySubtotal + monthlyVat),
    hasRecurring: monthlyItems.length > 0,
    recurringMonthly: monthlyItems.length > 0 
      ? monthlyItems.reduce((sum, c) => sum + c.totalPrice, 0)
      : undefined,
  };
}

// ============================================================================
// Pack Features
// ============================================================================

/**
 * Get features available for a property based on its membership pack
 */
export function getPropertyFeatures(
  packFeatures: MembershipPackFeatures,
  propertyStatus: PropertyStatus
): PropertyFeatures {
  const isLive = propertyStatus === 'live';

  return {
    // Pack-based features
    hasListing: packFeatures.listing,
    hasPageBuild: packFeatures.pageBuild,
    hasSocialMedia: packFeatures.socialMedia,
    hasBlogFeature: packFeatures.blogFeature,
    holidayPagesCount: packFeatures.holidayPages,
    hasHomepageFeature: packFeatures.homepageFeature,
    hasSpecialistPage: packFeatures.specialistPage,

    // Status-based features
    canReceiveEnquiries: isLive,
    isSearchable: isLive,
    showOnMap: isLive,
  };
}

/**
 * Check if a feature is available for a property
 */
export function hasFeature(
  features: PropertyFeatures,
  feature: keyof PropertyFeatures
): boolean {
  return Boolean(features[feature]);
}

/**
 * Validate if property can use a specific feature
 */
export function canUseFeature(
  packId: string,
  feature: keyof MembershipPackFeatures
): boolean {
  const packHierarchy: Record<string, MembershipPackFeatures> = {
    bronze: {
      listing: true,
      pageBuild: false,
      socialMedia: false,
      blogFeature: false,
      holidayPages: 0,
      homepageFeature: false,
      specialistPage: false,
    },
    silver: {
      listing: true,
      pageBuild: true,
      socialMedia: true,
      blogFeature: true,
      holidayPages: 3,
      homepageFeature: false,
      specialistPage: false,
    },
    gold: {
      listing: true,
      pageBuild: true,
      socialMedia: true,
      blogFeature: true,
      holidayPages: 3,
      homepageFeature: true,
      specialistPage: true,
    },
  };

  const pack = packHierarchy[packId];
  if (!pack) return false;

  return Boolean(pack[feature]);
}

// ============================================================================
// Property Lifecycle State Machine
// ============================================================================

/**
 * Check if a status transition is allowed
 */
export function canTransitionTo(
  currentStatus: PropertyStatus,
  newStatus: PropertyStatus
): boolean {
  const allowedTransitions: Record<PropertyStatus, PropertyStatus[]> = {
    draft: ['pending_approval'], // Only after payment
    pending_approval: ['live', 'rejected'], // Admin decision
    live: ['paused', 'expired'], // Owner or system action
    rejected: ['pending_approval'], // Can resubmit after edits
    paused: ['live'], // Owner resumes
    expired: ['pending_approval'], // Needs renewal payment
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Get next allowed statuses for a property
 */
export function getNextStatuses(currentStatus: PropertyStatus): PropertyStatus[] {
  const transitions: Record<PropertyStatus, PropertyStatus[]> = {
    draft: ['pending_approval'],
    pending_approval: ['live', 'rejected'],
    live: ['paused', 'expired'],
    rejected: ['pending_approval'],
    paused: ['live'],
    expired: ['pending_approval'],
  };

  return transitions[currentStatus] || [];
}

/**
 * Get human-readable status label and description
 */
export function getStatusInfo(status: PropertyStatus): {
  label: string;
  description: string;
  color: 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'purple';
} {
  const statusInfo: Record<PropertyStatus, ReturnType<typeof getStatusInfo>> = {
    draft: {
      label: 'Draft',
      description: 'Property not yet paid or submitted',
      color: 'gray',
    },
    pending_approval: {
      label: 'Pending Approval',
      description: 'Payment received, awaiting admin review',
      color: 'yellow',
    },
    live: {
      label: 'Live',
      description: 'Published and visible on website',
      color: 'green',
    },
    rejected: {
      label: 'Rejected',
      description: 'Admin rejected property',
      color: 'red',
    },
    paused: {
      label: 'Paused',
      description: 'Temporarily hidden by owner',
      color: 'blue',
    },
    expired: {
      label: 'Expired',
      description: 'Membership expired, needs renewal',
      color: 'purple',
    },
  };

  return statusInfo[status];
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Calculate subscription end date (always 12 months from start)
 */
export function calculateSubscriptionEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  return endDate;
}

/**
 * Check if subscription is expiring soon
 */
export function isExpiringSoon(endDate: Date, daysThreshold: number = 30): boolean {
  const now = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);

  return endDate > now && endDate <= threshold;
}

/**
 * Check if subscription has expired
 */
export function isExpired(endDate: Date): boolean {
  return endDate < new Date();
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(endDate: Date): number {
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate pro-rata refund amount for upgrade/cancellation
 */
export function calculateProRataRefund(
  totalPaid: number,
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): number {
  if (currentDate < startDate || currentDate > endDate) {
    return 0;
  }

  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.ceil(
    (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (totalPaid / totalDays) * remainingDays;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate property can be submitted for approval
 */
export function canSubmitForApproval(
  status: PropertyStatus,
  paymentStatus: PaymentStatus,
  hasRequiredFields: boolean
): { canSubmit: boolean; reason?: string } {
  if (!hasRequiredFields) {
    return { canSubmit: false, reason: 'Missing required property fields' };
  }

  if (paymentStatus !== 'paid') {
    return { canSubmit: false, reason: 'Payment required before submission' };
  }

  if (status !== 'draft' && status !== 'rejected' && status !== 'expired') {
    return { canSubmit: false, reason: `Cannot submit from ${status} status` };
  }

  return { canSubmit: true };
}

/**
 * Validate property can be approved by admin
 */
export function canApprove(
  status: PropertyStatus,
  paymentStatus: PaymentStatus
): { canApprove: boolean; reason?: string } {
  if (status !== 'pending_approval') {
    return { canApprove: false, reason: 'Property must be pending approval' };
  }

  if (paymentStatus !== 'paid') {
    return { canApprove: false, reason: 'Payment must be confirmed' };
  }

  return { canApprove: true };
}

/**
 * Validate upgrade is allowed
 */
export function canUpgrade(
  currentPackId: string,
  newPackId: string,
  subscriptionStatus: SubscriptionStatus
): { canUpgrade: boolean; reason?: string } {
  if (subscriptionStatus !== 'active') {
    return { canUpgrade: false, reason: 'Subscription must be active' };
  }

  const packOrder = { bronze: 1, silver: 2, gold: 3 };
  const currentOrder = packOrder[currentPackId as keyof typeof packOrder];
  const newOrder = packOrder[newPackId as keyof typeof packOrder];

  if (!currentOrder || !newOrder) {
    return { canUpgrade: false, reason: 'Invalid membership pack' };
  }

  if (newOrder <= currentOrder) {
    return { canUpgrade: false, reason: 'Can only upgrade to higher tier' };
  }

  return { canUpgrade: true };
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get pack comparison savings message
 */
export function getSavingsMessage(pack: MembershipPack): string {
  const annualTotal = pack.annualPrice * 1.2;
  const monthlyTotal = pack.monthlyPrice * 12 * 1.2;
  const savings = monthlyTotal - annualTotal;

  return `Save ${formatPrice(savings)} by choosing annual payment`;
}
