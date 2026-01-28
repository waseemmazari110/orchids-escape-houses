import { db } from '../src/db';
import { membershipPacks } from '../src/db/schema';

/**
 * Seed Membership Packs
 * 
 * This script initializes the three membership tiers:
 * - Bronze: £450/year or £40/month
 * - Silver: £650/year or £57/month
 * - Gold: £850/year or £75/month
 */

const packs = [
  {
    id: 'bronze',
    name: 'Bronze',
    description: 'Annual Membership with Fully Optimised Listing',
    annualPrice: 450.00,
    monthlyPrice: 40.00,
    vatRate: 20.00,
    features: {
      listing: true,
      pageBuild: false,
      socialMedia: false,
      blogFeature: false,
      holidayPages: 0,
      homepageFeature: false,
      specialistPage: false,
    },
    minimumCommitmentMonths: 12,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'silver',
    name: 'Silver',
    description: 'All Bronze features plus page build, social media promotion, blog features, and holiday focus pages',
    annualPrice: 650.00,
    monthlyPrice: 57.00,
    vatRate: 20.00,
    features: {
      listing: true,
      pageBuild: true,
      socialMedia: true,
      blogFeature: true,
      holidayPages: 3,
      homepageFeature: false,
      specialistPage: false,
    },
    minimumCommitmentMonths: 12,
    displayOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'All Silver features plus homepage features and specialist pages (Weddings, Youth, or Business)',
    annualPrice: 850.00,
    monthlyPrice: 75.00,
    vatRate: 20.00,
    features: {
      listing: true,
      pageBuild: true,
      socialMedia: true,
      blogFeature: true,
      holidayPages: 3,
      homepageFeature: true,
      specialistPage: true,
    },
    minimumCommitmentMonths: 12,
    displayOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seed() {
  console.log('🌱 Seeding membership packs...');

  try {
    for (const pack of packs) {
      await db.insert(membershipPacks).values({
        ...pack,
        features: JSON.stringify(pack.features),
      }).onConflictDoUpdate({
        target: membershipPacks.id,
        set: {
          name: pack.name,
          description: pack.description,
          annualPrice: pack.annualPrice,
          monthlyPrice: pack.monthlyPrice,
          vatRate: pack.vatRate,
          features: JSON.stringify(pack.features),
          minimumCommitmentMonths: pack.minimumCommitmentMonths,
          displayOrder: pack.displayOrder,
          isActive: pack.isActive,
          updatedAt: pack.updatedAt,
        },
      });

      console.log(`✅ ${pack.name} pack created/updated`);
      console.log(`   Annual: £${pack.annualPrice} + VAT (£${(pack.annualPrice * 1.2).toFixed(2)} total)`);
      console.log(`   Monthly: £${pack.monthlyPrice}/mo + VAT (£${(pack.monthlyPrice * 1.2).toFixed(2)}/mo total)`);
      console.log(`   Savings: £${(pack.monthlyPrice * 12) - pack.annualPrice} by choosing annual\n`);
    }

    console.log('✨ Membership packs seeded successfully!');
    console.log('\nPricing Summary:');
    console.log('━'.repeat(70));
    console.log('Pack    | Annual (+ VAT)      | Monthly (+ VAT)     | Annual Savings');
    console.log('━'.repeat(70));
    packs.forEach(pack => {
      const annualTotal = pack.annualPrice * 1.2;
      const monthlyTotal = pack.monthlyPrice * 1.2;
      const savings = (pack.monthlyPrice * 12) - pack.annualPrice;
      console.log(
        `${pack.name.padEnd(7)} | £${pack.annualPrice.toFixed(2)} (£${annualTotal.toFixed(2)})`.padEnd(22) + 
        `| £${pack.monthlyPrice.toFixed(2)} (£${monthlyTotal.toFixed(2)})`.padEnd(22) + 
        `| £${savings.toFixed(2)}`
      );
    });
    console.log('━'.repeat(70));

  } catch (error) {
    console.error('❌ Error seeding membership packs:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
