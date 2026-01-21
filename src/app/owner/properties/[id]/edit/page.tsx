"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OwnerPropertyForm } from "@/components/OwnerPropertyForm";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function OwnerEditPropertyPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties?id=${propertyId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load property");
        }
        
        const data = await response.json();
        
        // Convert API response (snake_case) to form format
        const convertedProperty = {
          title: data.title || '',
          property_type: data.propertyType || '',
          status: data.status || 'draft',
          description: data.description || '',
          address: data.address || '',
          town: data.town || '',
          county: data.county || '',
          postcode: data.postcode || '',
          country: data.country || 'United Kingdom',
          latitude: data.latitude,
          longitude: data.longitude,
          max_guests: data.sleepsMax || 8,
          bedrooms: data.bedrooms || 4,
          bathrooms: data.bathrooms || 2,
          amenities: data.amenities || [],
          features: data.features || [],
          check_in_time: data.checkInTime || '15:00',
          check_out_time: data.checkOutTime || '10:00',
          minimum_stay: data.minimumStay || 2,
          cancellation_policy: data.cancellationPolicy || '',
          house_rules: data.houseRules || '',
          base_price: data.priceFromMidweek || 0,
          weekend_price: data.priceFromWeekend,
          cleaning_fee: data.cleaningFee,
          security_deposit: data.securityDeposit,
          images: data.images || [],
          hero_video: data.heroVideo,
          meta_title: data.metaTitle,
          meta_description: data.metaDescription,
          slug: data.slug,
        };
        
        setProperty(convertedProperty);
      } catch (err: any) {
        setError(err.message || "Failed to load property");
        toast.error("Failed to load property");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Error Loading Property</h1>
            <p className="text-[var(--color-neutral-dark)] mb-6">{error}</p>
            <Link href="/owner-dashboard">
              <Button style={{ background: "var(--color-accent-sage)", color: "white" }}>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/owner-dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-4 text-[var(--color-accent-sage)] hover:text-[var(--color-accent-sage)]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 
              className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edit Property
            </h1>
            <p className="text-[var(--color-neutral-dark)] text-lg">
              Update your property details and settings.
            </p>
          </div>

          {/* Multi-Step Form */}
          <div>
            <OwnerPropertyForm propertyId={propertyId} initialData={property} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
