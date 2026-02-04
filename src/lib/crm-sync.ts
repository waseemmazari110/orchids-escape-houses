/**
 * Custom CRM Sync Engine
 * Auto-syncs data from main database to CRM tables
 */

import { db } from '@/db';
import { 
  crmContacts, 
  crmProperties, 
  crmEnquiries, 
  crmMemberships,
  crmInteractions,
  crmActivityLog,
  properties,
  user
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Sync owner data to CRM when user signs up
 */
export async function syncOwnerToCRM(userId: string, userData: any) {
  try {
    // Check if contact already exists
    const existing = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.userId, userId))
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⚠️ Owner already synced to CRM: ${userData.email}`);
      return existing[0];
    }

    const contactId = crypto.randomUUID();
    const contact = {
      id: contactId,
      type: 'owner' as const,
      firstName: userData.firstName || userData.name?.split(' ')[0] || '',
      lastName: userData.lastName || userData.name?.split(' ')[1] || '',
      email: userData.email,
      phone: userData.phone || userData.phoneNumber || '',
      businessName: userData.businessName || userData.companyName || '',
      taxId: userData.taxId || '',
      address: userData.address || '',
      city: userData.city || '',
      postcode: userData.postcode || '',
      country: userData.country || 'United Kingdom',
      status: 'active' as const,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: null,
      lastContactedAt: null,
      bankDetails: null,
      companyName: null,
      eventType: null,
    };
    
    await db.insert(crmContacts).values(contact);
    
    // Log activity
    await logActivity({
      entityType: 'contact',
      entityId: contactId,
      action: 'created',
      performedBy: 'system',
      reason: 'Owner signup',
    });
    
    console.log(`✅ Owner synced to CRM: ${userData.email}`);
    return contact;
  } catch (error) {
    console.error(`❌ Failed to sync owner to CRM:`, error);
    // Don't throw - CRM sync should not block user operations
    return null;
  }
}

/**
 * Sync property to CRM when owner creates property
 */
export async function syncPropertyToCRM(propertyData: any, userId: string) {
  try {
    // Get owner's CRM contact
    const ownerContact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.userId, userId))
      .limit(1);

    if (!ownerContact || ownerContact.length === 0) {
      console.log(`⚠️ Owner not found in CRM, syncing now...`);
      // Try to sync owner first
      const user = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.id, userId)
      });
      if (user) {
        const synced = await syncOwnerToCRM(userId, user);
        if (!synced) {
          throw new Error('Failed to sync owner to CRM');
        }
        return syncPropertyToCRM(propertyData, userId);
      }
      throw new Error('Owner not found');
    }

    const crmPropertyId = crypto.randomUUID();
    
    // Map property status to CRM listing status
    let listingStatus = 'draft';
    const status = propertyData.status || 'draft';
    if (status === 'live' || status === 'published' || status === 'Active') {
      listingStatus = 'live';
    } else if (status === 'pending_approval') {
      listingStatus = 'pending_approval';
    } else if (status === 'rejected') {
      listingStatus = 'rejected';
    } else if (status === 'paused') {
      listingStatus = 'paused';
    }
    
    // Map membership pack ID to tier
    let membershipTier = null;
    const packId = propertyData.membershipPackId || propertyData.planId;
    if (packId) {
      const tierMap: Record<string, string> = {
        '1': 'bronze',
        '2': 'silver',
        '3': 'gold',
      };
      membershipTier = tierMap[packId.toString()] || null;
    }
    
    const crmProperty = {
      id: crmPropertyId,
      ownerId: ownerContact[0].id,
      propertyId: propertyData.id,
      title: propertyData.title,
      location: propertyData.location || propertyData.city || '',
      bedrooms: propertyData.bedrooms || 0,
      bathrooms: propertyData.bathrooms || 0,
      maxGuests: propertyData.sleepsMax || propertyData.maxGuests || 0,
      pricePerNight: propertyData.priceFromWeekend || propertyData.pricePerNight || 0,
      listingStatus,
      membershipTier,
      viewCount: propertyData.viewCount || 0,
      enquiryCount: propertyData.enquiryCount || 0,
      bookingCount: 0,
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: propertyData.publishedAt || null,
      expiresAt: null,
      internalNotes: null,
      rejectionReason: null,
    };
    
    await db.insert(crmProperties).values(crmProperty);
    
    await logActivity({
      entityType: 'property',
      entityId: crmPropertyId,
      action: 'created',
      performedBy: 'system',
      reason: 'Property created',
    });
    
    console.log(`✅ Property synced to CRM: ${propertyData.title}`);
    return crmProperty;
  } catch (error) {
    console.error(`❌ Failed to sync property to CRM:`, error);
    return null;
  }
}

/**
 * Sync enquiry to CRM when guest submits form
 */
export async function syncEnquiryToCRM(enquiryData: any) {
  try {
    // Get or create guest contact (optional - for tracking interactions)
    let guestContactId = null;
    try {
      const guestContact = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.email, enquiryData.guestEmail || enquiryData.email))
        .limit(1);
      
      if (!guestContact || guestContact.length === 0) {
        // Create new guest contact
        guestContactId = crypto.randomUUID();
        const nameParts = (enquiryData.guestName || enquiryData.name || '').split(' ');
        await db.insert(crmContacts).values({
          id: guestContactId,
          type: 'guest',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: enquiryData.guestEmail || enquiryData.email,
          phone: enquiryData.guestPhone || enquiryData.phone || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          address: null,
          city: null,
          postcode: null,
          country: null,
          businessName: null,
          taxId: null,
          bankDetails: null,
          companyName: null,
          eventType: enquiryData.occasion || enquiryData.eventType || null,
          notes: null,
          lastContactedAt: null,
          userId: null,
        });
      } else {
        guestContactId = guestContact[0].id;
      }
    } catch (contactError) {
      console.error('⚠️ Error creating guest contact:', contactError);
      // Continue - guest contact is optional
    }

    // Get CRM property and owner ID
    let ownerId = null;
    let propertyId = null;

    if (enquiryData.propertyId) {
      try {
        // First, get the property from properties table to find owner
        const propertyResult = await db
          .select({ 
            id: properties.id,
            ownerId: properties.ownerId,
            title: properties.title,
          })
          .from(properties)
          .where(eq(properties.id, enquiryData.propertyId))
          .limit(1);

        if (propertyResult && propertyResult.length > 0) {
          const property = propertyResult[0];
          const propertyOwnerId = property.ownerId;
          
          console.log(`📝 Processing enquiry for property ${enquiryData.propertyId}, owner: ${propertyOwnerId}`);
          
          // Ensure owner is in crm_contacts
          if (propertyOwnerId) {
            try {
              // Look up by userId, not id (crm_contacts.id is UUID, userId is the actual user ID)
              const ownerInCRM = await db
                .select({ id: crmContacts.id })
                .from(crmContacts)
                .where(eq(crmContacts.userId, propertyOwnerId))
                .limit(1);
              
              if (!ownerInCRM || ownerInCRM.length === 0) {
                console.log(`⚠️ Owner ID ${propertyOwnerId} not found in crm_contacts, attempting to sync...`);
                
                // Try to fetch user from user table and sync them
                try {
                  const userResult = await db
                    .select()
                    .from(user)
                    .where(eq(user.id, propertyOwnerId))
                    .limit(1);
                  
                  if (userResult && userResult.length > 0) {
                    const userData = userResult[0];
                    console.log(`📝 Found user ${propertyOwnerId}, syncing to crm_contacts...`);
                    
                    // Sync owner to CRM
                    await syncOwnerToCRM(propertyOwnerId, {
                      email: userData.email,
                      name: userData.name || 'Owner',
                    });
                    
                    ownerId = propertyOwnerId;
                    console.log(`✅ Owner ${propertyOwnerId} synced to crm_contacts`);
                  } else {
                    console.log(`⚠️ Owner user ID ${propertyOwnerId} not found in user table`);
                  }
                } catch (syncError) {
                  console.error('⚠️ Error syncing owner to CRM:', syncError);
                }
              } else {
                // Found owner, use the crm_contacts.id
                ownerId = ownerInCRM[0].id;
                console.log(`✅ Found owner ${propertyOwnerId} in crm_contacts with id ${ownerId}`);
              }
            } catch (error) {
              console.error('⚠️ Error checking owner in CRM:', error);
            }
          }
          
          // Ensure property is in crm_properties
          try {
            const crmPropertyCheck = await db
              .select({ id: crmProperties.id })
              .from(crmProperties)
              .where(eq(crmProperties.propertyId, enquiryData.propertyId))
              .limit(1);
            
            if (crmPropertyCheck && crmPropertyCheck.length > 0) {
              propertyId = crmPropertyCheck[0].id;
              console.log(`✅ Found property ${enquiryData.propertyId} in crm_properties with id ${propertyId}`);
            } else {
              console.log(`⚠️ Property ID ${enquiryData.propertyId} not found in crm_properties`);
            }
          } catch (error) {
            console.error('⚠️ Error checking property in CRM:', error);
          }
        }
      } catch (error) {
        console.error('⚠️ Error fetching property details:', error);
      }
    }

    // If we still don't have owner, log warning but continue
    if (!ownerId) {
      console.log(`⚠️ Enquiry sync: Owner not in CRM, will create as unassigned`);
    }
    if (!propertyId) {
      console.log(`⚠️ Enquiry sync: Property not in CRM, will create without property link`);
    }

    // Create enquiry record - only core fields
    const enquiryRecord: any = {
      id: randomUUID(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    
    // Add optional fields only if they exist
    if (ownerId) {
      enquiryRecord.ownerId = ownerId;
    }
    if (propertyId) {
      enquiryRecord.propertyId = propertyId;
    }
    if (enquiryData.guestEmail || enquiryData.email) {
      enquiryRecord.guestEmail = enquiryData.guestEmail || enquiryData.email;
    }
    if (enquiryData.guestPhone || enquiryData.phone) {
      enquiryRecord.guestPhone = enquiryData.guestPhone || enquiryData.phone;
    }
    if (enquiryData.guestName || enquiryData.name) {
      enquiryRecord.guestName = enquiryData.guestName || enquiryData.name;
    }
    if (enquiryData.message) {
      enquiryRecord.message = enquiryData.message;
    }
    
    console.log(`📊 Enquiry record prepared with ${Object.keys(enquiryRecord).length} fields:`, Object.keys(enquiryRecord).join(', '));
    
    // Verify FKs exist in database before insert
    if (ownerId) {
      const ownerExists = await db
        .select({ id: crmContacts.id })
        .from(crmContacts)
        .where(eq(crmContacts.id, ownerId))
        .limit(1);
      
      if (!ownerExists || ownerExists.length === 0) {
        console.error(`❌ Owner FK validation failed: ${ownerId} not found in crm_contacts`);
      } else {
        console.log(`✅ Owner FK verified: ${ownerId}`);
      }
    }
    
    
    if (propertyId) {
      const propertyExists = await db
        .select({ id: crmProperties.id })
        .from(crmProperties)
        .where(eq(crmProperties.id, propertyId))
        .limit(1);
      
      if (!propertyExists || propertyExists.length === 0) {
        console.error(`❌ Property FK validation failed: ${propertyId} not found in crm_properties`);
      } else {
        console.log(`✅ Property FK verified: ${propertyId}`);
      }
    }
    
    try {
      await db.insert(crmEnquiries).values(enquiryRecord);
      console.log(`✅ Enquiry synced to CRM for ${enquiryData.guestEmail}`);
    } catch (insertError) {
      console.error(`❌ Failed to insert enquiry record (database schema mismatch - skipping):`, insertError instanceof Error ? insertError.message : insertError);
      return null; // Don't throw - let enquiry processing continue
    }
    
    return enquiryRecord;
  } catch (error) {
    console.error(`❌ Failed to sync enquiry to CRM:`, error);
    return null;
  }
}

/**
 * Sync membership to CRM when payment successful
 */
export async function syncMembershipToCRM(userId: string, membershipData: any) {
  try {
    // Get contact
    const contact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.userId, userId))
      .limit(1);

    if (!contact || contact.length === 0) {
      console.log(`⚠️ Contact not found in CRM for membership sync`);
      return null;
    }

    const membershipId = crypto.randomUUID();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    const membership = {
      id: membershipId,
      contactId: contact[0].id,
      planTier: membershipData.planTier || membershipData.planId || 'bronze',
      planPrice: membershipData.planPrice || membershipData.amount || 0,
      billingCycle: membershipData.billingCycle || 'annual',
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      renewalDate: endDate.toISOString(),
      status: 'active' as const,
      autoRenew: true,
      stripeCustomerId: membershipData.stripeCustomerId || null,
      stripeSubscriptionId: membershipData.stripeSubscriptionId || null,
      lastPaymentDate: new Date().toISOString(),
      lastPaymentAmount: membershipData.planPrice || membershipData.amount || 0,
      nextPaymentDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cancelledDate: null,
      paymentFailureCount: 0,
      notes: null,
    };
    
    await db.insert(crmMemberships).values(membership);
    
    // Log interaction
    await logInteraction({
      contactId: contact[0].id,
      type: 'status_change',
      content: `Membership activated: ${membershipData.planTier || 'bronze'}`,
      direction: 'outbound',
      initiatedBy: 'system',
      relatedPropertyId: null,
      relatedEnquiryId: null,
    });
    
    await logActivity({
      entityType: 'membership',
      entityId: membershipId,
      action: 'created',
      performedBy: 'system',
      reason: 'Membership purchase',
    });
    
    console.log(`✅ Membership synced to CRM: ${membershipId}`);
    return membership;
  } catch (error) {
    console.error(`❌ Failed to sync membership to CRM:`, error);
    return null;
  }
}

/**
 * Update enquiry status in CRM
 */
export async function updateEnquiryStatusInCRM(enquiryId: string, newStatus: string, notes?: string) {
  try {
    const updateData: any = {
      status: newStatus,
    };
    if (notes) {
      updateData.internalNotes = notes;
    }
    
    await db
      .update(crmEnquiries)
      .set(updateData)
      .where(eq(crmEnquiries.id, enquiryId));
    
    console.log(`✅ Enquiry status updated in CRM: ${enquiryId} → ${newStatus}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update enquiry status in CRM:`, error);
    return false;
  }
}

/**
 * Update property in CRM when main property is updated
 */
export async function updatePropertyInCRM(propertyId: number, updates: any) {
  try {
    const crmProperty = await db
      .select()
      .from(crmProperties)
      .where(eq(crmProperties.propertyId, propertyId))
      .limit(1);

    if (!crmProperty || crmProperty.length === 0) {
      console.log(`⚠️ Property not found in CRM: ${propertyId}`);
      return null;
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.title) updateData.title = updates.title;
    if (updates.location) updateData.location = updates.location;
    if (updates.status) updateData.listingStatus = updates.status;
    if (updates.bedrooms) updateData.bedrooms = updates.bedrooms;
    if (updates.bathrooms) updateData.bathrooms = updates.bathrooms;
    if (updates.rejectionReason) updateData.rejectionReason = updates.rejectionReason;

    await db
      .update(crmProperties)
      .set(updateData)
      .where(eq(crmProperties.id, crmProperty[0].id));

    console.log(`✅ Property updated in CRM: ${propertyId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update property in CRM:`, error);
    return false;
  }
}

/**
 * Update membership status in CRM (for cancellations, renewals, etc.)
 */
export async function updateMembershipInCRM(userId: string, statusUpdate: any) {
  try {
    // Get contact
    const contact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.userId, userId))
      .limit(1);

    if (!contact || contact.length === 0) {
      console.log(`⚠️ Contact not found in CRM for membership update`);
      return null;
    }

    // Get active membership
    const membership = await db
      .select()
      .from(crmMemberships)
      .where(eq(crmMemberships.contactId, contact[0].id))
      .limit(1);

    if (!membership || membership.length === 0) {
      console.log(`⚠️ Membership not found for contact: ${contact[0].id}`);
      return null;
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Handle status change
    if (statusUpdate.status) {
      updateData.status = statusUpdate.status;
      
      if (statusUpdate.status === 'cancelled') {
        updateData.cancelledDate = new Date().toISOString();
      }
    }

    // Handle payment updates
    if (statusUpdate.lastPaymentDate) {
      updateData.lastPaymentDate = statusUpdate.lastPaymentDate;
    }
    if (statusUpdate.lastPaymentAmount !== undefined) {
      updateData.lastPaymentAmount = statusUpdate.lastPaymentAmount;
    }
    if (statusUpdate.nextPaymentDate) {
      updateData.nextPaymentDate = statusUpdate.nextPaymentDate;
    }

    // Handle renewal info
    if (statusUpdate.renewalDate) {
      updateData.renewalDate = statusUpdate.renewalDate;
    }
    if (statusUpdate.autoRenew !== undefined) {
      updateData.autoRenew = statusUpdate.autoRenew;
    }

    // Handle payment failures
    if (statusUpdate.paymentFailed) {
      updateData.paymentFailureCount = (membership[0].paymentFailureCount || 0) + 1;
    }

    await db
      .update(crmMemberships)
      .set(updateData)
      .where(eq(crmMemberships.id, membership[0].id));

    console.log(`✅ Membership updated in CRM: ${membership[0].id} → ${statusUpdate.status || 'updated'}`);
    return membership[0];
  } catch (error) {
    console.error(`❌ Failed to update membership in CRM:`, error);
    return null;
  }
}

/**
 * Log CRM activity
 */
async function logActivity(data: {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  reason: string;
}) {
  try {
    await db.insert(crmActivityLog).values({
      entityType: data.entityType,
      entityId: data.entityId,
      activityType: data.action,
      title: `${data.action} ${data.entityType}`,
      description: data.reason,
      outcome: null,
      performedBy: data.performedBy,
      metadata: null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log CRM activity:', error);
  }
}

/**
 * Log interaction
 */
async function logInteraction(data: {
  contactId: string;
  type: string;
  content: string;
  direction: string;
  initiatedBy: string;
  relatedEnquiryId?: string | null;
  relatedPropertyId?: string | null;
}) {
  try {
    const interactionId = crypto.randomUUID();
    await db.insert(crmInteractions).values({
      id: interactionId,
      contactId: data.contactId,
      relatedEnquiryId: data.relatedEnquiryId || null,
      relatedPropertyId: data.relatedPropertyId || null,
      type: data.type,
      content: data.content,
      direction: data.direction,
      initiatedBy: data.initiatedBy,
      createdAt: new Date().toISOString(),
      subject: null,
      readAt: null,
      metadata: null,
    });
  } catch (error) {
    console.error('Failed to log CRM interaction:', error);
  }
}
