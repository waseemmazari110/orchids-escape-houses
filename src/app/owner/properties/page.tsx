"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id: string | number;
  title: string;
  description?: string;
  address?: string;
  town?: string;
  county?: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  sleepsMax?: number;
  max_guests?: number;
  base_price?: number;
  priceFromMidweek?: number;
  heroImage?: string;
  images?: string[];
  location?: string;
}

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Fetch owner's properties from internal API
      // Always fetch without status filter to get ALL properties
      const response = await fetch("/api/owner/properties?status=all");
      
      if (!response.ok) {
        throw new Error(`Failed to load properties: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("🔍 RESPONSE FROM /api/owner/properties:", data);
      console.log("🔍 Response type:", typeof data);
      console.log("🔍 Is array?:", Array.isArray(data));
      console.log("🔍 Has properties field?:", data?.properties);
      
      // Handle both array and object with properties field
      const propsArray = Array.isArray(data) ? data : (data.properties || []);
      console.log("🔍 FINAL PROPS ARRAY:", propsArray);
      console.log("🔍 PROPS COUNT:", propsArray.length);
      
      if (propsArray.length === 0) {
        console.warn("⚠️ No properties found! Check API response above.");
      }
      
      setProperties(propsArray);
    } catch (error: any) {
      console.error("❌ Error fetching properties:", error);
      toast.error(error.message || "Failed to load properties");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      setDeleting(propertyId);
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete property");
      }
      
      toast.success("Property deleted successfully");
      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete property");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || 'default';
    switch (statusLower) {
      case "active":
        return "text-green-700 bg-green-100";
      case "draft":
        return "text-yellow-700 bg-yellow-100";
      case "inactive":
        return "text-gray-700 bg-gray-100";
      default:
        return "text-blue-700 bg-blue-100";
    }
  };

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 
                  className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Your Properties
                </h1>
                <p className="text-[var(--color-neutral-dark)] text-lg mt-2">
                  Manage and edit your property listings
                </p>
              </div>
              <Link href="/choose-plan">
                <Button 
                  className="rounded-xl text-white flex items-center gap-2"
                  style={{ background: "var(--color-accent-sage)" }}
                >
                  <Plus className="w-5 h-5" />
                  Add Property
                </Button>
              </Link>
            </div>
          </div>

          {/* Properties List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-sage)]" />
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-[var(--color-accent-gold)] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">No Properties Yet</h2>
              <p className="text-[var(--color-neutral-dark)] mb-8 max-w-md mx-auto">
                Start by creating your first property listing. It only takes a few minutes!
              </p>
              <Link href="/choose-plan">
                <Button 
                  className="rounded-xl text-white"
                  style={{ background: "var(--color-accent-sage)" }}
                >
                  Create First Property
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {properties.map((property) => {
                  // Get image from either heroImage or images array
                  const imageUrl = property.heroImage || property.images?.[0];
                  // Get price from either priceFromMidweek or base_price
                  const price = property.priceFromMidweek || property.base_price || 0;
                  // Get guest count from either sleepsMax or max_guests
                  const maxGuests = property.sleepsMax || property.max_guests;
                  // Get location from either location field or address + town
                  const displayLocation = property.location || `${property.address || ''}${property.town ? ', ' + property.town : ''}`.trim();
                  
                  return (
                    <div 
                      key={property.id} 
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      {/* Property Image */}
                      {imageUrl && (
                        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(property.status)}`}>
                            {property.status}
                          </div>
                        </div>
                      )}

                      {/* Property Details */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 line-clamp-2">
                          {property.title}
                        </h3>
                        
                        <p className="text-sm text-[var(--color-neutral-dark)] mb-3">
                          {displayLocation}
                        </p>

                        {/* Property Stats */}
                        <div className="flex items-center gap-3 text-sm text-[var(--color-neutral-dark)] mb-4">
                          {property.bedrooms && (
                            <span>🛏️ {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                          )}
                          {maxGuests && (
                            <span>👥 {maxGuests} guests</span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-lg font-bold text-[var(--color-accent-gold)] mb-4">
                          £{price.toFixed(2)} / night
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Link href={`/owner/properties/${property.id}/edit`} className="flex-1">
                            <Button 
                              variant="outline"
                              className="w-full rounded-xl border-2 border-[var(--color-accent-sage)] text-[var(--color-accent-sage)] hover:bg-[var(--color-accent-sage)]/5"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </Link>

                          <button
                            onClick={() => handleDelete(property.id.toString())}
                            disabled={deleting === property.id.toString()}
                            className="flex-1 px-3 py-2 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-100 font-semibold transition-colors disabled:opacity-50"
                          >
                            {deleting === property.id.toString() ? (
                              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 inline mr-2" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Management Buttons Section */}
              <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8">
                <Link href="/owner/properties/new">
                  <Button 
                    className="w-full rounded-xl text-white py-3 text-lg font-semibold"
                    style={{ background: "var(--color-accent-sage)" }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Property
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
